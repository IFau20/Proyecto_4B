import { JsonConflictError, type JsonStore } from "./jsonStore.ts";

export type BlobClient=Pick<typeof import("@vercel/blob"),"get"|"put"|"del"|"BlobPreconditionFailedError"|"BlobNotFoundError">;

// All JSON stays private. Consistent reads are required for OAuth revocation
// and for merging history written concurrently by separate function instances.
export function createBlobStore(client?:BlobClient):JsonStore {
  const sdk=async()=>client??await import("@vercel/blob");
  const conflict=async(error:unknown)=>{
    const {BlobPreconditionFailedError,BlobNotFoundError}=await sdk();
    return error instanceof BlobPreconditionFailedError||error instanceof BlobNotFoundError;
  };
  return {
    async get<T>(key:string){
      const result=await (await sdk()).get(key,{access:"private",useCache:false});
      if(!result)return null;
      if(result.statusCode!==200)throw Error("Unexpected private storage response");
      return {value:await new Response(result.stream).json() as T,etag:result.blob.etag};
    },
    async put<T>(key:string,value:T,etag:string|null){
      try{
        await (await sdk()).put(key,JSON.stringify(value),{
          access:"private",contentType:"application/json",addRandomSuffix:false,
          cacheControlMaxAge:60,allowOverwrite:etag!==null,...(etag?{ifMatch:etag}:{}),
        });
      }catch(error){
        if(await conflict(error))throw new JsonConflictError();
        // Create-only conflicts use the SDK's generic error. Verify that a
        // concurrent writer actually created the record before retrying.
        if(etag===null&&await (await sdk()).get(key,{access:"private",useCache:false}))throw new JsonConflictError();
        throw error;
      }
    },
    async remove(key:string,etag:string){
      try{await (await sdk()).del(key,{ifMatch:etag});}
      catch(error){
        if(await conflict(error))throw new JsonConflictError();
        throw error;
      }
    },
  };
}
