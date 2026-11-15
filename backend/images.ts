import type { getNotebooks } from "./notebooks.ts";
type Laptop = Awaited<ReturnType<typeof getNotebooks>>[number];
const allowedHosts = [
  "solotodo.com","spdigital.cl","winpy.cl","centrale.cl","paris.cl",
  "ripley.cl","falabella.com","cdn.shopify.com","cloudinary.com",
  "mercadolibre.cl","mercadolibre.com","mlstatic.com",
  "p4-ofp.static.pub","buyitdirect.ie",
  "media-cdn.bnn.in.th","microless.com","cdn.panacompu.com",
  "ipl.com.vn","lacuracao.pe","cdn1.technopark.ru",
  "media.falabella.com","imagenes.deltron.com.pe",
];
const mediaTypes=new Set(["image/jpeg","image/png","image/webp","image/avif"]);
// Model-family photography from public manufacturer/retailer product pages.
// Used when the SoloTodo picture endpoint returns HTTP 406.
const verifiedModelImages: Record<string,string> = {
  "83JC0080CL":"https://p4-ofp.static.pub/fes/cms/2024/04/24/bor6k5n2pohl9j145ripyl85iwo76e960068.png",
  "DB9V5AT#ABM":"https://www.buyitdirect.ie/Images/C38LJAT_1_Supersize.jpg?v=3",
};
// Candidate images documented from the same exact SKU or model family.
// Source CDN restrictions are respected: a failed request falls through to another
// public source without credentials, fake referrers, or anti-bot bypasses.
export const additionalNotebookImages: Record<string, string[]> = {
  "82XM00M4CL": [
    "https://media-cdn.bnn.in.th/310124/lenovo-ideapad-slim-3-1515abr8-artic-gray-1.jpg",
    "https://microless.com/cdn/products/5c86bbccc5832797c338837ff97bd8b9-hi.jpg",
    "https://media.falabella.com/falabellaPE/143411067_03/w%3D1500%2Ch%3D1500%2Cfit%3Dcover"
  ],
  "BA1U9LA": [
    "https://cdn.panacompu.com/cdn-img/pv/hp-victus-15-15-fb3009la-right-view.jpg?fixedwidthheight=false&height=400&width=550"
  ],
  "CH8Z6LA": [
    "https://cdn.panacompu.com/cdn-img/pv/hp-victus-15-15-fb3009la-right-view.jpg?fixedwidthheight=false&height=400&width=550"
  ],
  "83GSX029CL": [
    "https://ipl.com.vn/uploads/files/%E1%BA%A2nh%20s%E1%BA%A3n%20ph%E1%BA%A9m/Laptop%20Lenovo%20LOQ%2015IAX9%2083GS001RVN.jpg",
    "https://www.lacuracao.pe/media/catalog/product/p/s/ps31733728_3.jpg?bg-color=255%2C255%2C255&canvas=700%3A700&fit=bounds&height=700&quality=85&width=700"
  ],
  "83GSX013CL": [
    "https://www.lacuracao.pe/media/catalog/product/p/s/ps31733728_3.jpg?bg-color=255%2C255%2C255&canvas=700%3A700&fit=bounds&height=700&quality=85&width=700",
    "https://media.falabella.com/falabellaPE/146612892_08/w%3D1500%2Ch%3D1500%2Cfit%3Dcover"
  ],
  "NH.DADAL.002.1": [
    "https://cdn1.technopark.ru/technopark/photos_resized/product/1000_1000/823048/2_823048.jpg?timestamp=2026-03-04_09-38-25"
  ],
  "BM6U5LA": [
    "https://media.falabella.com/falabellaCL/17482526_5/w%3D1500%2Ch%3D1500%2Cfit%3Dcover"
  ],
  "D62W3LA": [
    "https://imagenes.deltron.com.pe/images/productos/carrusel/NBHPD62W3LA/NBHPD62W3LA_8_1781020864.jpg"
  ]
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
  const rawCandidates=[
    verifiedModelImages[sku],...(additionalNotebookImages[sku]??[]),product.imageUrl,
    ...((product.offers??[]).map(o=>o.imageUrl))
  ];
  const candidates=[...new Set(rawCandidates.filter((url):url is string=>
    typeof url==="string"&&isAllowedNotebookImage(url)))];
  if(!candidates.length)return new Response("Image unavailable",{status:404});
  for(const url of candidates){
    const hit=cache.get(url);
    if(hit&&Date.now()<hit.expires)return new Response(hit.data.slice(),{
      status:200,headers:{"Content-Type":hit.mime,"Cache-Control":"public, max-age=3600"}
    });
    try {
      const response=await fetcher(url,{
        signal:AbortSignal.timeout(4500),redirect:"error",
        headers:{"Accept":"image/avif,image/webp,image/png,image/jpeg,*/*"}
      });
      const mime=(response.headers.get("content-type")||"").split(";")[0].toLowerCase();
      if(!response.ok||!mediaTypes.has(mime))continue;
      const announcedSize=Number(response.headers.get("content-length")||"0");
      if(announcedSize>4*1024*1024)continue;
      const bytes=new Uint8Array(await response.arrayBuffer());
      if(!bytes.length||bytes.length>4*1024*1024)continue;
      cache.set(url,{expires:Date.now()+3600000,mime,data:bytes});
      return new Response(bytes.slice(),{status:200,headers:{
        "Content-Type":mime,"Cache-Control":"public, max-age=3600",
        "X-Content-Type-Options":"nosniff"
      }});
    }catch {
      // A failed source must not prevent using a genuine alternative.
    }
  }
  return new Response("Image sources unavailable",{status:502});
}
