import type { getNotebooks } from "./notebooks.ts";
type Laptop = Awaited<ReturnType<typeof getNotebooks>>[number];
const allowedHosts = [
  "solotodo.com","spdigital.cl","winpy.cl","centrale.cl","paris.cl",
  "ripley.cl","falabella.com","cdn.shopify.com","cloudinary.com",
  "mercadolibre.cl","mercadolibre.com","mlstatic.com",
];
const mediaTypes=new Set(["image/jpeg","image/png","image/webp","image/avif"]);
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
  if(!product?.imageUrl||!isAllowedNotebookImage(product.imageUrl)) {
    return new Response("Image unavailable",{status:404});
  }
  const cacheKey=product.imageUrl;
  const hit=cache.get(cacheKey);
  if(hit&&Date.now()<hit.expires)return new Response(hit.data.slice(),{
    status:200,headers:{"Content-Type":hit.mime,"Cache-Control":"public, max-age=3600"}
  });
  try {
    const result=await fetcher(cacheKey,{
      signal:AbortSignal.timeout(6500),
      redirect:"error",
      headers:{"Accept":"image/avif,image/webp,image/png,image/jpeg"},
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
