// Public endpoints used by PC Factory's product widget. No account or cart is queried.
export const PC_FACTORY_BRANCH_IDS:Record<string,string>={
 "2":"pcfactory-montt","22":"pcfactory-costanera","28":"pcfactory-huerfanos",
 "48":"pcfactory-lascondes","47":"pcfactory-egana","42":"pcfactory-kennedy",
 "50":"pcfactory-norte","36":"pcfactory-florida","5":"pcfactory-vina",
 "49":"pcfactory-maipu","37":"pcfactory-cantagallo","40":"pcfactory-vitacura",
 "9":"pcfactory-oeste","45":"pcfactory-vespucio","8":"pcfactory-laserena",
 "7":"pcfactory-concepcion","41":"pcfactory-temuco","24":"pcfactory-antofagasta"
};
const API="https://api.pcfactory.cl/pcfactory-services-catalogo/v1/catalogo/productos/";
const amount=(v:unknown)=>typeof v==="number"&&Number.isSafeInteger(v)&&v>=100000&&v<=15000000?v:null;
export type PcBranch={sourceId:string;sku:string;status:"in_stock"|"out_of_stock";quantity:number;
 approximate:boolean;closedAtCheck:boolean;checkedAt:string;sourceUrl:string};
export function parsePcFactoryProduct(product:any,prices:any,stock:any,sku:string,id:number,checkedAt:string){
 if(product?.id!==id||typeof product.partNumber!=="string"||product.partNumber.split("#")[0].trim().toUpperCase()!==sku.split("#")[0].toUpperCase())return null;
 const price=prices?.id===id?prices.precio:null;
 const branches:PcBranch[]=[];
 let availability="unknown";
 if(stock?.id===id&&Array.isArray(stock.disponibilidad)){
  for(const group of stock.disponibilidad){
   for(const branch of Array.isArray(group?.sucursales)?group.sucursales:[]){
    if(!/^\d{1,6}$/.test(String(branch?.aproximado??"")))continue;
    const quantity=Number(branch.aproximado);
    if(branch.nombre==="Internet"&&branch.despacho===true)availability=quantity>0?"in_stock":"out_of_stock";
    const sourceId=PC_FACTORY_BRANCH_IDS[String(branch.id)];
    if(!sourceId||branch.retiro!==true)continue;
    branches.push({sourceId,sku,status:quantity>0?"in_stock":"out_of_stock",quantity,
      approximate:true,closedAtCheck:branch.cerrada===true,checkedAt,sourceUrl:API+id+"/stock"});
   }
  }
 }
 return {priceClp:amount(price?.efectivo),listPriceClp:amount(price?.referencia),availability,branches,checkedAt,
  stockVerified:stock?.id===id&&Array.isArray(stock.disponibilidad)};
}
type Result=ReturnType<typeof parsePcFactoryProduct>;
const cache=new Map<string,{at:number;result:Result}>();
const pending=new Map<string,Promise<Result>>();
export async function fetchPcFactoryProduct(url:string,sku:string,fetcher:typeof fetch=fetch):Promise<Result>{
 let id:number;
 try{const u=new URL(url);const match=/^\/producto\/(\d+)(?:-|\/|$)/.exec(u.pathname);
  if(u.protocol!=="https:"||!["www.pcfactory.cl","pcfactory.cl"].includes(u.hostname)||!match)return null;
  id=Number(match[1]);if(!Number.isSafeInteger(id))return null;
 }catch{return null;}
 const key=id+":"+sku;
 const cached=cache.get(key);
 if(fetcher===fetch&&cached&&Date.now()-cached.at<10*60*1000)return cached.result;
 if(fetcher===fetch&&pending.has(key))return pending.get(key)!;
 const work=(async()=>{
  const get=async(suffix:string)=>{
   const response=await fetcher(API+id+suffix,{signal:AbortSignal.timeout(7000),redirect:"error",headers:{Accept:"application/json"}});
   if(!response.ok)throw Error("PC Factory API unavailable");return response.json();
  };
  try{
   // Identity must succeed; price and stock can fail independently.
   const [product,prices,stock]=await Promise.all([get(""),get("/precio").catch(()=>null),get("/stock").catch(()=>null)]);
   const result=parsePcFactoryProduct(product,prices,stock,sku,id,new Date().toISOString());
   if(fetcher===fetch&&result?.stockVerified)cache.set(key,{at:Date.now(),result});
   return result;
  }catch{return null;}
 })().finally(()=>pending.delete(key));
 if(fetcher===fetch)pending.set(key,work);return work;
}
