import type { getNotebooks } from "./notebooks.ts";
type Laptop = Awaited<ReturnType<typeof getNotebooks>>[number];
const allowedHosts = [
  "solotodo.com","spdigital.cl","winpy.cl","centrale.cl","paris.cl",
  "ripley.cl","falabella.com","cdn.shopify.com","cloudinary.com",
  "mercadolibre.cl","mercadolibre.com","mlstatic.com",
  "p4-ofp.static.pub","buyitdirect.ie",
];
const mediaTypes=new Set(["image/jpeg","image/png","image/webp","image/avif"]);
// Model-family photography from public manufacturer/retailer product pages.
// Used when the SoloTodo picture endpoint returns HTTP 406.
const verifiedModelImages: Record<string,string> = {
  "83JC0080CL":"https://p4-ofp.static.pub/fes/cms/2024/04/24/bor6k5n2pohl9j145ripyl85iwo76e960068.png",
  "DB9V5AT#ABM":"https://www.buyitdirect.ie/Images/C38LJAT_1_Supersize.jpg?v=3",
};
const cache=new Map<string,{expires:number,mime:string,data:Uint8Array}>();
export function isAllowedNotebookImage(urlText:string) {
  try {
    const url=new URL(urlText);
    if(url.protocol!=="https:"||url.username||url.password||url.port) return false;
    return allowedHosts.some(host=>url.hostname===host||url.hostname.endsWith("."+host));
  } catch { return false; }
}
export async function proxyNotebookImage(
  sku:string,
  products:readonly Laptop[],
  fetcher:typeof fetch=fetch,
):Promise<Response> {
  const product=products.find(x=>x.sku===sku);
  if(!product) return new Response("Image unavailable",{status:404});
  const curated=verifiedModelImages[sku];
  const cacheKey=curated && isAllowedNotebookImage(curated) ? curated : product.imageUrl;
  if(!cacheKey||!isAllowedNotebookImage(cacheKey)) {
    return new Response("Image unavailable",{status:404});
  }
  const hit=cache.get(cacheKey);
  if(hit&&Date.now()<hit.expires)return new Response(hit.data.slice(),{
    status:200,headers:{"Content-Type":hit.mime,"Cache-Control":"public, max-age=3600"}
  });
  try {
    const result=await fetcher(cacheKey,{
      signal:AbortSignal.timeout(6500),
      redirect:"error",
      headers:{"Accept":"*/*"},
    });
    const mime=(result.headers.get("content-type")||"").split(";")[0].toLowerCase();
    if(!result.ok||!mediaTypes.has(mime))return new Response("Image unavailable",{status:502});
    const announcedSize=Number(result.headers.get("content-length")||"0");
    if(announcedSize>4*1024*1024)return new Response("Image too large",{status:413});
    const bytes=new Uint8Array(await result.arrayBuffer());
    if(!bytes.length||bytes.length>4*1024*1024)return new Response("Image unavailable",{status:502});
    cache.set(cacheKey,{expires:Date.now()+3600000,mime,data:bytes});
    return new Response(bytes.slice(),{status:200,headers:{
      "Content-Type":mime,"Cache-Control":"public, max-age=3600","X-Content-Type-Options":"nosniff"
    }});
  }catch{
    return new Response("Image unavailable",{status:502});
  }
}
