import {mapWithConcurrency} from "./concurrency.ts";
import {getPublicProductId} from "./solotodoHistory.ts";

// Fetch the public currently listed offers for a matched manufacturer SKU.
// The published amount is a reference, not direct confirmation by a retailer.
export type CatalogLaptop = {
  sku:string;profileUrl:string|null;imageUrl:string|null;
  offers:Array<Record<string,any>>;
};
const API="https://publicapi.solotodo.com";
function normalize(text:string) {
  return text.split("#")[0].replace(/[^a-z0-9]/gi,"").toUpperCase();
}
const currency=(value:unknown)=>{
  const amount=typeof value==="number"?value:typeof value==="string"?Number(value):NaN;
  return Number.isSafeInteger(amount)&&amount>=100000&&amount<=15000000?amount:null;
};
const safeLink=(text:unknown)=>{
  if(typeof text!=="string")return false;
  try{return new URL(text).protocol==="https:";}catch{return false;}
};
async function getJson(url:string,fetcher:typeof fetch) {
  const response=await fetcher(url,{signal:AbortSignal.timeout(7500),headers:{Accept:"application/json"}});
  if(!response.ok)throw Error("Public SoloTodo API unavailable: "+response.status);
  return await response.json();
}
export function addPublishedOffers(products:CatalogLaptop[],publicRows:unknown,storeRows:unknown) {
  const entries=Array.isArray((publicRows as any)?.results)?(publicRows as any).results:
    Array.isArray(publicRows)?publicRows:[];
  const stores=Array.isArray(storeRows)?storeRows:Array.isArray((storeRows as any)?.results)?(storeRows as any).results:[];
  const storeNames=new Map(stores.filter((s:any)=>Number.isInteger(s?.id)&&typeof s?.name==="string")
    .map((s:any)=>[s.id,s.name]));
  let added=0;
  for(const entry of entries){
    const product=products.find(p=>getPublicProductId(p.profileUrl)===entry?.product?.id);
    if(!product||normalize(entry?.product?.part_number||"")!==normalize(product.sku))continue;
    const entities=Array.isArray(entry.entities)?entry.entities:[];
    const byStore=new Map<number,{price:number;entity:any}>();
    for(const entity of entities){
      const storeId=entity?.store_id;
      const registry=entity?.active_registry;
      if(!Number.isInteger(storeId)||entity?.currency_id!==1||
         entity?.is_visible===false||!registry||registry?.is_available!==true||
         /used|reacondicionad|refurbished|open.?box|usado/i.test(String(entity.condition||""))||
         !safeLink(entity.external_url)) continue;
      const amount=currency(registry.offer_price);
      if(amount===null)continue;
      const previous=byStore.get(storeId);
      if(!previous||amount<previous.price)byStore.set(storeId,{price:amount,entity});
    }
    for(const [storeId,{price,entity}] of byStore){
      const name=storeNames.get(storeId)||"Tienda "+storeId;
      if(product.offers.some(o=>String(o.sourceName).toLowerCase().includes(String(name).toLowerCase())))continue;
      product.offers.push({
        sourceId:"solotodo-"+storeId,
        sourceName:name,url:entity.external_url,
        priceClp:null,referencePriceClp:price,
        // The public endpoint does not guarantee a discount is unconditional.
        referenceNormalPriceClp:null,referenceDiscountPercent:null,
        referenceObservedOn:null,paymentCondition:null,availability:"unknown",
        queryStatus:"public_reference",
        reportedAvailability:"in_stock",
        reportedAt:entity.last_pricing_update||entity.active_registry?.timestamp||null,
        checkedAt:entity.last_pricing_update||entity.active_registry?.timestamp||null
      });
      added++;
    }
    if(!product.imageUrl&&safeLink(entry.product.picture_url))product.imageUrl=entry.product.picture_url;
  }
  return added;
}
export async function enrichPublishedNotebookOffers(products:CatalogLaptop[],fetcher:typeof fetch=fetch) {
  const ids=[...new Set(products.map(p=>getPublicProductId(p.profileUrl)).filter((id):id is number=>id!==null))];
  if(!ids.length)return 0;
  // Keep requests bounded: the endpoint can page large product collections.
  // Each response is for at most 12 exact product IDs, no bulk catalog scraping.
  // Two independent price-feed batches at once; store directory fetched in parallel.
  // This avoids serial network latency without high-volume scraping.
  const storeDirectoryPromise=getJson(API+"/stores/",fetcher).catch(()=>[]);
  const chunks:number[][]=[];
  for(let offset=0;offset<ids.length;offset+=12)chunks.push(ids.slice(offset,offset+12));
  const responses=await mapWithConcurrency(chunks,2,async(part,offset)=>{
    const url=new URL(API+"/products/available_entities/");
    for(const productId of part)url.searchParams.append("ids",String(productId));
    url.searchParams.set("page_size",String(part.length));
    try{return await getJson(url.href,fetcher);}
    catch(error){console.warn("Public notebook prices unavailable for batch",offset,error);return null;}
  });
  const stores=await storeDirectoryPromise;
  let results=0;
  for(const rows of responses)if(rows)results+=addPublishedOffers(products,rows,stores);
  return results;
}
