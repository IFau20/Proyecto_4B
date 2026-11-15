import {fetchPcFactoryProduct} from "./pcFactory.ts";
import {STORES} from "./stores.ts";
import {getNotebookPreview} from "./notebooks.ts";
import {enrichPublishedNotebookOffers} from "./solotodoCatalog.ts";
export type BranchStock={sourceId:string;sku:string;status:"in_stock"|"out_of_stock";
 quantity:number|null;approximate?:boolean;closedAtCheck?:boolean;checkedAt:string;sourceUrl:string;};
const states=new WeakMap<typeof fetch,{
 cache:Map<string,{at:number;records:BranchStock[]}>;
 pending:Map<string,Promise<BranchStock[]>>;
}>();
type StockNotebook={sku:string;offers:Array<{sourceName?:string;url?:string}>};
type StockLookup=(sku:string,fetcher:typeof fetch)=>Promise<StockNotebook|null>;
const pcFactoryUrl=(value:unknown)=>{
 if(typeof value!=="string")return false;
 try{const u=new URL(value);return u.protocol==="https:"&&!u.port&&!u.username&&!u.password&&
  ["pcfactory.cl","www.pcfactory.cl"].includes(u.hostname)&&/^\/producto\/\d+(?:-|\/|$)/.test(u.pathname);
 }catch{return false;}
};
async function resolveStockNotebook(sku:string,fetcher:typeof fetch):Promise<StockNotebook|null>{
 const known=getNotebookPreview().find(p=>p.sku===sku);
 if(!known)return null;
 if(known.offers.some(o=>pcFactoryUrl(o.url)))return known;
 // Discover just this product; a fast catalog preview is not proof of no stock.
 const notebook={...known,offers:[...known.offers]};
 await enrichPublishedNotebookOffers([notebook],fetcher);
 return notebook;
}
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
export async function branchStockForSku(sku:string,fetcher:typeof fetch=fetch,lookup:StockLookup=resolveStockNotebook):Promise<BranchStock[]>{
 if(!/^[A-Za-z0-9_.#-]{1,100}$/.test(sku))return [];
 let state=states.get(fetcher);
 if(!state){state={cache:new Map(),pending:new Map()};states.set(fetcher,state);}
 const {cache,pending}=state;
 const previous=cache.get(sku);
 if(previous&&Date.now()-previous.at<10*60*1000)return previous.records;
 const inProgress=pending.get(sku);
 if(inProgress)return inProgress;
 const work=(async()=>{
   const notebook=await lookup(sku,fetcher);
   if(!notebook)return [];
   const urls=[...new Set(notebook.offers.map(o=>o.url).filter((url):url is string=>pcFactoryUrl(url)))].slice(0,2);
   if(!urls.length)return [];
   const checkedAt=new Date().toISOString();
   const results=await Promise.all(urls.map(async url=>{
     try{
       const api=await fetchPcFactoryProduct(url,sku,fetcher);
       if(api?.branches.length)return api.branches;
       const response=await fetcher(url,{signal:AbortSignal.timeout(6000),redirect:"error",headers:{Accept:"text/html"}});
       return response.ok?parseBranchInventory(await response.text(),sku,url,checkedAt):[];
     }catch{return [];}
   }));
   const records=[...new Map(results.flat().map(x=>[x.sourceId,x])).values()];
   if(!records.length)throw Error("Branch inventory unavailable for this product");
   if(records.length)cache.set(sku,{at:Date.now(),records});
   return records;
 })().finally(()=>pending.delete(sku));
 pending.set(sku,work);return work;
}
