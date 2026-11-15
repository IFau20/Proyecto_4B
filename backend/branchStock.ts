import {fetchPcFactoryProduct} from "./pcFactory.ts";
import {STORES} from "./stores.ts";
import {getNotebookPreview} from "./notebooks.ts";
export type BranchStock={sourceId:string;sku:string;status:"in_stock"|"out_of_stock";
 quantity:number|null;approximate?:boolean;closedAtCheck?:boolean;checkedAt:string;sourceUrl:string;};
const cache=new Map<string,{at:number;records:BranchStock[]}>();
const pending=new Map<string,Promise<BranchStock[]>>();
const clean=(s:string)=>s.normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/\s+/g," ").toLowerCase().trim();
const visible=(s:string)=>s.replace(/<(script|style|noscript)\b[^>]*>[\s\S]*?<\/\1>/gi," ")
  .replace(/<[^>]*>/g," ").replace(/&nbsp;|&#160;/gi," ").replace(/\s+/g," ").trim();
function escapeRegex(value:string){return value.replace(/[^a-z0-9 ]/gi,"\\$&");}
export function parseBranchInventory(html:string,sku:string,sourceUrl:string,checkedAt:string):BranchStock[] {
 if(!/^[A-Za-z0-9_.#-]{1,100}$/.test(sku)||!clean(html).includes(clean(sku)))return [];
 const text=clean(visible(html));
 const title="disponibilidad de retiro en tienda";
 const sectionStart=text.indexOf(title);
 // Without an exact product and its branch stock section, do not claim
 // that a unit is available in any store.
 const section=sectionStart>=0?text.slice(sectionStart+title.length):"";
 const found:BranchStock[]=[];
 const aliases:Record<string,string[]>={
   "pcfactory-costanera":["mall costanera center","mall cenco costanera"],
   "pcfactory-maipu":["mall arauco maipu"],
   "pcfactory-florida":["mall florida center","mall cenco florida"],
   "pcfactory-norte":["mall plaza norte"],
   "pcfactory-egana":["mall plaza egana"],
   "pcfactory-oeste":["mall plaza oeste"],
   "pcfactory-vespucio":["mall plaza vespucio"],
   "pcfactory-kennedy":["open kennedy"],
 };
 for(const store of STORES){
   if(!store.sourceId.startsWith("pcfactory-"))continue;
   const labels=aliases[store.sourceId]??[clean(store.name).replace(/^pc factory\s*[—–-]\s*/,"")];
   for(const name of labels){
     const pattern=new RegExp("\\b"+escapeRegex(clean(name))+"\\b\\s*(?:\\+?\\s*(\\d{1,5})\\s*unidades?|sin stock|agotad[oa]|no disponible)\\b","i");
     const match=pattern.exec(section);
     if(!match)continue;
     const quantity=match[1]!==undefined?Number(match[1]):0;
     found.push({sourceId:store.sourceId,sku,status:quantity>0?"in_stock":"out_of_stock",
       quantity,checkedAt,sourceUrl});
     break;
   }
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
       const api=await fetchPcFactoryProduct(url,sku,fetcher);
       if(api?.branches.length)return api.branches;
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
