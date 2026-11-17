import { strictEqual as equal, deepStrictEqual as same, rejects } from "node:assert/strict";
import { createBlobStore, type BlobClient } from "./blobStore.ts";
import { JsonConflictError } from "./jsonStore.ts";
class BlobPreconditionFailedError extends Error {}
class BlobNotFoundError extends Error {}

Deno.test("private Blob adapter bypasses stale reads and conditionally updates and consumes JSON",async()=>{
 const records=new Map<string,{text:string;etag:string}>();let revision=0;
 const client={
  BlobPreconditionFailedError,BlobNotFoundError,
  async get(key:string,options:any){
   equal(options.access,"private");equal(options.useCache,false);
   const record=records.get(key);if(!record)return null;
   return {statusCode:200,stream:new Response(record.text).body,headers:new Headers(),blob:{
    url:"https://test.private.blob.vercel-storage.com/"+key,downloadUrl:"https://test.private.blob.vercel-storage.com/"+key,
    pathname:key,contentType:"application/json",contentDisposition:"attachment",cacheControl:"max-age=60",
    uploadedAt:new Date(),etag:record.etag,size:record.text.length,
   }};
  },
  async put(key:string,text:string,options:any){
   equal(options.access,"private");equal(options.addRandomSuffix,false);
   const old=records.get(key);
   if(old&&(!options.allowOverwrite||options.ifMatch!==old.etag))throw new BlobPreconditionFailedError();
   records.set(key,{text,etag:String(++revision)});
  },
  async del(key:string,options:any){
   if(records.get(key)?.etag!==options.ifMatch)throw new BlobPreconditionFailedError();
   records.delete(key);
  },
 } as unknown as BlobClient;
 const first=createBlobStore(client),second=createBlobStore(client);
 await first.put("session.json",{name:"User"},null);
 const record=(await second.get<{name:string}>("session.json"))!;
 same(record.value,{name:"User"});
 await second.put("session.json",{name:"Updated"},record.etag);
 await rejects(()=>first.put("session.json",{name:"Lost update"},record.etag),JsonConflictError);
 await rejects(()=>first.remove("session.json",record.etag),JsonConflictError);
 const latest=(await first.get("session.json"))!;
 await second.remove("session.json",latest.etag);
 equal(await first.get("session.json"),null);
});
