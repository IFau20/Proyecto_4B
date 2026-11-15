import { getLiveProduct } from "./liveSources.ts";
import { getHpProduct } from "./hpSources.ts";
import { parseAvailability } from "./liveSources.ts";
import { saveObservations } from "./history.ts";

// All laptop identities and specifications are sourced from public manufacturer/retailer
// listings or SoloTodo product pages. Prices are NOT imported from SoloTodo.
// Aggregator product pages are used only for product identification and photography.
const retailer = (sourceId: string, sourceName: string, url: string) => ({ sourceId, sourceName, url });
export const NOTEBOOKS = [
  { sku:"83JC0080CL", name:"Lenovo LOQ 15ARP9", ramGb:24, gpu:"NVIDIA GeForce RTX 4050", processor:"AMD Ryzen 7 7435HS", kind:"legacy", sources:[] },
  { sku:"DB9V5AT#ABM", name:"HP 250R G10", ramGb:16, gpu:"Intel Graphics", processor:"Intel Core 5 120U", kind:"hp", sources:[] },
  { sku:"D0CJ4LA", name:"HP 15-fd0331la", ramGb:8, gpu:"Intel UHD Graphics", processor:"Intel Core 3 100U", sources:[
    retailer("spdigital","SP Digital","https://www.spdigital.cl/notebook-hp-15-fd0331la-156-fhd-intel-core-3-100u-8gb-ddr5-512gb-ssd-full-hd-wi-fi-6-w11-home/")
  ], profileUrl:"https://www.solotodo.cl/products/382294-hp-15-fd0331la-d0cj4la" },
  { sku:"82XM00M4CL", name:"Lenovo IdeaPad Slim 3 15ABR8", ramGb:16, gpu:"AMD Radeon Graphics", processor:"AMD Ryzen 7 5825U", sources:[
    retailer("spdigital","SP Digital","https://www.spdigital.cl/lv-ideapad-slim-3-gen-8-r7-5825u-16gb-512gb-156-fhd-tretroiluminado-abyss-blue/"),
    retailer("winpy","Winpy","https://www.winpy.cl/venta/notebook-lenovo-ideapad-slim-3-de-15-6-ryzen-7-5825u-16gb-ram-512gb-ssd-win11/")
  ], profileUrl:"https://www.solotodo.cl/notebooks" },
  { sku:"BA1U9LA", name:"HP Victus 15-fb3009la", ramGb:8, gpu:"NVIDIA GeForce RTX 3050", processor:"AMD Ryzen 5 8645HS", sources:[
    retailer("spdigital","SP Digital","https://www.spdigital.cl/victus-laptop-156-fhd-nt-r58645hs-08gb-512gb-rtx305006gb-win-silver/")
  ], profileUrl:"https://www.solotodo.cl/products/355283-hp-victus-15-fb3009la-ba1u9la" },
  { sku:"CH8Z6LA", name:"HP Victus 15-fb3036la", ramGb:16, gpu:"NVIDIA GeForce RTX 4050", processor:"AMD Ryzen 7 7445HS", sources:[
    retailer("spdigital","SP Digital","https://www.spdigital.cl/15-fb3036la-r7-7445h-16gb-1t-156in-w11h/")
  ], profileUrl:"https://www.solotodo.cl/products/369514-hp-victus-15-fb3036la-ch8z6la" },
  { sku:"NP750XGJ-KS5CL", name:"Samsung Galaxy Book4", ramGb:16, gpu:"Intel Iris Xe Graphics", processor:"Intel Core i5-1335U", sources:[
    retailer("paris","Paris","https://www.paris.cl/samsung-galaxy-book4-i5-156-512gb-16gb-ram-MKRISZTQKN.html"),
    retailer("paris2","Paris — otra publicación","https://www.paris.cl/notebook-galaxy-book4-intel-core-i5-13va-gen-16gb-ram-512gb-ssd-156-windows-silver-151337999.html")
  ], profileUrl:"https://www.solotodo.cl/products/255552-samsung-galaxy-book4-silver-np750xgj-ks5cl" },
  { sku:"83GSX029CL", name:"Lenovo LOQ 15IAX9", ramGb:16, gpu:"NVIDIA GeForce RTX 3050", processor:"Intel Core i5-12450HX", sources:[],
    profileUrl:"https://www.solotodo.cl/products/280318-lenovo-loq-15iax9-83gsx029cl" },
  { sku:"NH.DADAL.002.1", name:"Acer Nitro Lite NL16-71G", ramGb:16, gpu:"NVIDIA GeForce RTX 3050", processor:"Intel Core i5-13420H", sources:[],
    profileUrl:"https://www.solotodo.cl/products/360843-acer-nitro-lite-nitro-lite-nl16-71g-56q8-1-nhdadal0021" },
  { sku:"BM6U5LA", name:"HP Omen 16-ap0002la", ramGb:16, gpu:"NVIDIA GeForce RTX 5060", processor:"AMD Ryzen AI 7 350", sources:[],
    profileUrl:"https://www.solotodo.cl/products/354293-hp-omen-16-ap0002la-bm6u5la" },
  { sku:"83GSX013CL", name:"Lenovo LOQ 15IAX9 RTX 2050", ramGb:8, gpu:"NVIDIA GeForce RTX 2050", processor:"Intel Core i5-12450HX", sources:[],
    profileUrl:"https://www.solotodo.cl/notebooks" },
  { sku:"83LY003NCL", name:"Lenovo Legion 5 15IRX10", ramGb:32, gpu:"NVIDIA GeForce RTX 5070", processor:"Intel Core i9-14900HX", sources:[],
    profileUrl:"https://www.solotodo.cl/notebooks" },
  { sku:"D62W3LA", name:"HP Omen HyperX 15-ga0001la", ramGb:16, gpu:"NVIDIA GeForce RTX 5060", processor:"Intel Core i7-14650HX", sources:[],
    profileUrl:"https://www.solotodo.cl/notebooks" },
] as const;

function parsedMoney(value: string) {
  const cleaned=value.trim().replace(/[\s$]/g,"");
  if (!/^\d{1,3}(?:\.\d{3})+(?:,\d{2})?$/.test(cleaned) &&
      !/^\d{6,8}$/.test(cleaned)) return null;
  const amount=Number(cleaned.replace(/\./g,"").replace(/,\d{2}$/,""));
  return Number.isSafeInteger(amount)&&amount>=100000&&amount<=15000000?amount:null;
}
const plain=(html:string)=>html.replace(/<(script|style|noscript)\b[^>]*>[\s\S]*?<\/\1>/gi," ")
  .replace(/<[^>]+>/g," ").replace(/&(?:nbsp|#160);/gi," ").replace(/\s+/g," ").trim();
function productIdentifierPresent(html:string,sku:string) {
  const text=plain(html).toUpperCase();
  return text.includes(sku.toUpperCase()) || text.includes(sku.replace(/#.*$/,"").toUpperCase());
}
export function calcDiscount(price:number|null,normal:number|null) {
  if (!price||!normal||!Number.isSafeInteger(price)||!Number.isSafeInteger(normal)||price>=normal) return null;
  const pct=Math.round((normal-price)*100/normal);
  return (normal-price)/normal>=0.20 && (normal-price)/normal<=0.90 ? pct : null;
}
function metaImage(html:string,baseUrl:string) {
  const tags=html.match(/<meta\b[^>]+>/gi)||[];
  for (const tag of tags) {
    if (!/property\s*=\s*["']og:image["']|name\s*=\s*["']twitter:image["']/i.test(tag)) continue;
    const content=/(?:content)\s*=\s*(["'])(.*?)\1/i.exec(tag)?.[2];
    try {
      const url=new URL(content||"",baseUrl);
      if(url.protocol==="https:" && !/\.(?:svg)(?:\?|$)/i.test(url.pathname)) return url.href;
    }catch{}
  }
  return null;
}
export function parseStorePage(html:string,sku:string,sourceId:string) {
  const empty={ priceClp:null as number|null, listPriceClp:null as number|null,
    discountPercent:null as number|null, availability:"unknown", imageUrl:null as string|null };
  if(!productIdentifierPresent(html,sku)) return empty;
  const text=plain(html);
  let priceClp:null|number=null, listPriceClp:null|number=null, availability="unknown";
  // Specific labels, not unrelated merchandising, crossed-out cart totals or installments.
  if(sourceId==="spdigital"){
    const normal=/\bNormal\s*\$?\s*([\d.]+)/i.exec(text);
    const current=/Pago con transferencia\s*\$?\s*([\d.]+)/i.exec(text);
    priceClp=parsedMoney(current?.[1]||"");
    listPriceClp=parsedMoney(normal?.[1]||"");
    if(/(?:Sin stock|Agotado|No disponible)\b/i.test(text.slice(0,1200))) availability="out_of_stock";
  } else if(sourceId==="winpy") {
    if(/Temporalmente Agotado|Producto Agotado/i.test(text)) availability="out_of_stock";
    const price=/Transferencia o Dep[oó]sito\s*\$?\s*([\d.]+)/i.exec(text);
    priceClp=parsedMoney(price?.[1]||"");
    if(/\d+\s+unidades?\s+en\s+stock/i.test(text)) availability="in_stock";
  } else if(sourceId==="paris"||sourceId==="paris2"){
    // Only accept page prices when model appears in the same published product document.
    const after=/(\d{1,2})%\s*\$?\s*([\d.]+)\s*\$?\s*([\d.]+)/i.exec(text);
    if(after) {
      priceClp=parsedMoney(after[2]);
      listPriceClp=parsedMoney(after[3]);
    }
    if(/Sin stock|Producto agotado|Justo se agot[oó]/i.test(text)) availability="out_of_stock";
  }
  return {...empty,priceClp,listPriceClp,discountPercent:calcDiscount(priceClp,listPriceClp),availability};
}
const LIMIT_MS=7500;
async function fetchSource(model:typeof NOTEBOOKS[number],source:{sourceId:string;sourceName:string;url:string},fetcher:typeof fetch,checkedAt:string) {
  let details= {priceClp:null as number|null,listPriceClp:null as number|null,
    discountPercent:null as number|null,availability:"unknown",imageUrl:null as string|null };
  let queryStatus="unverified";
  try{
    const response=await fetcher(source.url,{signal:AbortSignal.timeout(LIMIT_MS),headers:{Accept:"text/html"}});
    if(!response.ok){queryStatus=[403,429].includes(response.status)?"blocked":"http_error";}
    else {
      const html=await response.text();
      details=parseStorePage(html,model.sku,source.sourceId);
      // An image is attached only to the page for the validated model.
      if(productIdentifierPresent(html,model.sku)) details.imageUrl=metaImage(html,source.url);
      queryStatus=details.priceClp!==null||details.availability!=="unknown"?"verified":"unverified";
    }
  }catch{queryStatus="network_error";}
  return {...source,...details,queryStatus,checkedAt};
}
let catalogCache:Awaited<ReturnType<typeof buildNotebooks>>|null=null;
let cacheAt=0, pending:Promise<Awaited<ReturnType<typeof buildNotebooks>>>|null=null;
export async function buildNotebooks(fetcher:typeof fetch=fetch,now=new Date()) {
  const [lenovo,hp]=fetcher===fetch
    ? await Promise.allSettled([getLiveProduct(),getHpProduct()])
    : await Promise.allSettled([Promise.resolve(null),Promise.resolve(null)]);
  const base=NOTEBOOKS.map((model,index)=>({
    id:"notebook-"+index,sku:model.sku,name:model.name,ramGb:model.ramGb,
    gpu:model.gpu,processor:model.processor,isLive:true,
    profileUrl:"profileUrl" in model?model.profileUrl:null,
    imageUrl:null as string|null,offers:[] as any[],verification:null as any
  }));
  const time=now.toISOString();
  const tasks:Promise<void>[]=[];
  for(let i=0;i<NOTEBOOKS.length;i++){
    const model=NOTEBOOKS[i];
    if("kind" in model && model.kind==="legacy" && lenovo.status==="fulfilled" && lenovo.value){
      base[i].offers=lenovo.value!.offers.map(({referencePriceClp:_r,...offer}:any)=>offer);
    } else if("kind" in model && model.kind==="hp" && hp.status==="fulfilled" && hp.value){
      base[i].offers=hp.value!.offers.map(({referencePriceClp:_r,referenceType:_rt,...offer}:any)=>offer);
    } else if("sources" in model && model.sources.length){
      tasks.push(Promise.all(model.sources.map(source=>fetchSource(model,source,fetcher,time)))
        .then(offers=>{base[i].offers=offers;}).catch(()=>{}));
    }
  }
  await Promise.all(tasks);
  // Image metadata never constitutes evidence of a price or product discount.
  const photos=base.map(async (p)=>{
    p.imageUrl=p.offers.find(o=>o.imageUrl)?.imageUrl??null;
    if(p.imageUrl || !p.profileUrl || !p.profileUrl.includes("/products/"))return;
    try{
      const response=await fetcher(p.profileUrl,{signal:AbortSignal.timeout(4500)});
      if(response.ok){
        const html=await response.text();
        if(productIdentifierPresent(html,p.sku))p.imageUrl=metaImage(html,p.profileUrl);
      }
    }catch{}
  });
  await Promise.all(photos);
  for(const p of base){
    p.verification={
      totalSources:p.offers.length,
      verifiedPrices:p.offers.filter(o=>o.priceClp!==null).length,
      verifiedStocks:p.offers.filter(o=>o.availability!=="unknown").length
    };
  }
  return base;
}
export async function getNotebooks() {
  if(catalogCache&&Date.now()-cacheAt<15*60*1000)return catalogCache;
  if(pending)return pending;
  pending=buildNotebooks();
  try {catalogCache=await pending;cacheAt=Date.now();return catalogCache;}
  finally{pending=null;}
}
export async function collectNotebookHistory() {
  const products=await getNotebooks();
  for(const product of products){
    try{ await saveObservations(product.sku,product.offers); }
    catch(e){console.error("History storage unavailable",product.sku,e);}
  }
}
