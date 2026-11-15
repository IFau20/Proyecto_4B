// Public OpenStreetMap Nominatim geocoding. Only store addresses are sent; never
// user coordinates. Results are cached by address and requests are serialized.
const pointCache=new Map<string,{lat:number;lon:number}|null>();
let serial:Promise<unknown>=Promise.resolve();
const pause=(ms:number)=>new Promise(resolve=>setTimeout(resolve,ms));
export async function geocodeStoreAddress(address:string, fetcher:typeof fetch=fetch) {
  if(pointCache.has(address))return pointCache.get(address)??null;
  const job=serial.catch(()=>{}).then(async()=>{
    if(pointCache.has(address))return pointCache.get(address)??null;
    const query=new URL("https://nominatim.openstreetmap.org/search");
    query.searchParams.set("q",address);query.searchParams.set("format","json");
    query.searchParams.set("limit","1");query.searchParams.set("countrycodes","cl");
    try {
      const response=await fetcher(query.href,{
        signal:AbortSignal.timeout(4500),headers:{
          "Accept":"application/json","Accept-Language":"es",
          "User-Agent":"PCTracker-academic-course/1.0 (github.com/IFau20/Proyecto_4B)"
        }
      });
      if(!response.ok)return null;
      const data=await response.json();
      const point=Array.isArray(data)?data[0]:null;
      const lat=Number(point?.lat),lon=Number(point?.lon);
      if(!point||!Number.isFinite(lat)||!Number.isFinite(lon)||
         lat> -17||lat< -57||lon< -66||lon> -76)return null;
      const found={lat,lon};
      pointCache.set(address,found);
      return found;
    }catch{return null;}
    finally{await pause(1100);}
  });
  serial=job;
  return await job;
}
export async function geocodeStoreLocations<T extends {address:string;lat:number|null;lon:number|null}>(
  stores:T[],fetcher:typeof fetch=fetch,
):Promise<T[]> {
  const result: T[]=[];
  // Do not parallelize public Nominatim requests; 1+ second between queries.
  for(const store of stores){
    if(Number.isFinite(store.lat)&&Number.isFinite(store.lon)){result.push(store);continue;}
    const point=await geocodeStoreAddress(store.address,fetcher);
    result.push(point?{...store,...point}:store);
  }
  return result;
}
