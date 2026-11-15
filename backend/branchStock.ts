import {STORES} from "./stores.ts";
import {getNotebookPreview} from "./notebooks.ts";
export type BranchStock={sourceId:string;sku:string;status:"in_stock"|"out_of_stock";
 quantity:number|null;checkedAt:string;sourceUrl:string;};
const cache=new Map<string,{at:number;records:BranchStock[]}>();
const pending=new Map<string,Promise<BranchStock[]>>();
const clean=(s:string)=>s.normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/\s+/g," ").toLowerCase().trim();
const visible=(s:string)=>s.replace(/<(script|style|noscript)\b[^>]*>[\s\S]*?<\/\1>/gi," ")
  .replace(/<[^>]*>/g," ").replace(/&nbsp;|&#160;/gi," ").replace(/\s+/g," ").trim();
function escapeRegex(value:string){return value.replace(/[^a-z0-9 ]/gi,"\\$&");}
export function parseBranchInventory(html:string,sku:string,sourceUrl:string,checkedAt:string):BranchStock[] {
 if(!/^[A-Za-z0-9_.#-]{1,100}$/.test(sku)||!clean(html).includes(clean(sku)))return [];
 const text=clean(visible(html));
 const found:BranchStock[]=[];
 for(const store of STORES){
   if(!store.sourceId.startsWith("pcfactory-"))continue;
   const branch=escapeRegex(clean(store.name).replace(/^pc factory\s*[—–-]\s*/,""));
   const match=new RegExp("(?:sucursal|tienda)\\s*:?\\s*"+branch+"\\b(.{0,105})","i").exec(text);
   if(!match)continue;
   const segment=match[1].split(/\b(?:sucursal|tienda)\s*:?/)[0];
   let status:BranchStock["status"]|null=null;
   let quantity:number|null=null;
   const qty=/(?:stock|disponibles?|unidades?)\s*:?\s*(\d{1,5})\b/.exec(segment);
   if(qty){quantity=Number(qty[1]);status=quantity>0?"in_stock":"out_of_stock";}
   else if(/(?:sin stock|agotad[oa]|no disponible)\b/.test(segment)){quantity=0;status="out_of_stock";}
   if(status)found.push({sourceId:store.sourceId,sku,status,quantity,checkedAt,sourceUrl});
 }
 return found;
}
export async function branchStockForSku(sku:string,fetcher:typeof fetch=fetch):Promise<BranchStock[]>{
 if(!/^[A-Za-z0-9_.#-]{1,100}$/.test(sku))return [];
 const previous=cache.get(sku);
 if(previous&&Date.now()-previous.at<10*60*1000)return previous.records;
 const inProgress=pending.get(sku);
 if(inProgress)return inProgress;
 const work=(async()=>{
   const notebook=getNotebookPreview().find(p=>p.sku===sku);
   if(!notebook)return [];
   const urls=[...new Set(notebook.offers.filter(o=>/pc\s*factory/i.test(String(o.sourceName||""))&&
     typeof o.url==="string").map(o=>o.url as string))].filter(url=>{
     try{const u=new URL(url);return u.protocol==="https:"&&
       ["pcfactory.cl","www.pcfactory.cl"].includes(u.hostname);}catch{return false;}
   }).slice(0,2);
   const checkedAt=new Date().toISOString();
   const results=await Promise.all(urls.map(async url=>{
     try{
       const response=await fetcher(url,{signal:AbortSignal.timeout(6000),headers:{Accept:"text/html"}});
       return response.ok?parseBranchInventory(await response.text(),sku,url,checkedAt):[];
     }catch{return [];}
   }));
   const records=[...new Map(results.flat().map(x=>[x.sourceId,x])).values()];
   cache.set(sku,{at:Date.now(),records});
   return records;
 })().finally(()=>pending.delete(sku));
 pending.set(sku,work);return work;
}
