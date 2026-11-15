import { parseRetailOffer, summarizeVerification } from "./liveSources.ts";

export const HP_PRODUCT = {
  id: "hp-250r-g10-db9v5at", sku: "DB9V5AT#ABM", isLive: true,
  name: "HP 250R G10 (DB9V5AT#ABM)", ramGb: 16,
  gpu: "Intel Graphics", processor: "Intel Core 5 120U",
  sources: [
    {
      sourceId: "winpy", sourceName: "Winpy",
      referencePriceClp: 559968, referenceType: "published_listing",
      url: "https://www.winpy.cl/venta/notebook-hp-250r-g10-de-15-6-core-5-120u-16gb-ddr5-512gb-ssd-freedos/",
    },
    {
      sourceId: "spdigital", sourceName: "SP Digital",
      referencePriceClp: 877530, referenceType: "published_listing",
      url: "https://www.spdigital.cl/hp-250r-g10-intel-5120u-15-16gb-512-ssd-freedos/",
    },
    {
      sourceId: "pcexpress", sourceName: "PC Express",
      referencePriceClp: 539900, referenceType: "published_listing",
      url: "https://tienda.pc-express.cl/21702-notebook-hp-250r-intel-core-5-120u-16gb-512-gb-15-6-freedos-3-0-p-n-db9v5at-abm",
    },
    {
      sourceId: "greenchip", sourceName: "GreenChip",
      url: "https://greenchip.cl/products/hp-250r-g10-intel-5120u-15-16gb-512-ssd-freedos",
    },
  ],
};
function toClp(value: string | undefined): number | null {
  if (!value) return null;
  const digits=value.replace(/\./g,"").trim();
  if (!/^\d{6,8}$/.test(digits)) return null;
  const number=Number(digits);
  return Number.isSafeInteger(number)&&number>=100000&&number<=15000000?number:null;
}
function plainText(html: string): string {
  return html.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi," ")
    .replace(/<[^>]+>/g," ").replace(/&nbsp;|&#160;/gi," ")
    .replace(/\s+/g," ").trim();
}
export function parseHpOffer(html: string, sourceId: string) {
  if (typeof html !== "string" || !html.toUpperCase().includes(HP_PRODUCT.sku)) {
    return { priceClp: null, availability: "unknown" };
  }
  const structured=parseRetailOffer(html,HP_PRODUCT.sku,sourceId);
  if (structured.priceClp!==null && structured.availability!=="unknown") return structured;
  const text=plainText(html);
  const skuIndex=text.toUpperCase().indexOf(HP_PRODUCT.sku);
  if (skuIndex<0) return structured;
  let priceClp: number | null=structured.priceClp;
  let availability=structured.availability;
  // Each source is matched by its exact official product identifier first.
  if (sourceId==="winpy") {
    const before=text.slice(Math.max(0,skuIndex-3000),skuIndex);
    const transferAt=before.lastIndexOf("Transferencia o Depósito");
    const prices=transferAt>=0? [...before.slice(Math.max(0,transferAt-300),transferAt)
      .matchAll(/\$\s*([\d.]+)/g)].map(match=>toClp(match[1])).filter(x=>x!==null):[];
    // The site's sale price is the first amount before the crossed-out reference.
    priceClp ??= prices[0]??null;
    if (/\b\d+\s+unidades?\s+en\s+stock\b/i.test(before.slice(-650))) availability="in_stock";
    if (/\b(?:Temporalmente Agotado|Producto Agotado)\b/i.test(before.slice(-700))) availability="out_of_stock";
  } else if (sourceId==="spdigital") {
    const after=text.slice(skuIndex,skuIndex+650);
    const match=/Pago con transferencia\s*\$\s*([\d.]+)/i.exec(after);
    priceClp ??= match?toClp(match[1]):null;
    // An unqualified "Stock online" heading is not a verified quantity.
  } else if (sourceId==="pcexpress") {
    const after=text.slice(skuIndex,skuIndex+1300);
    const match=/Transferencia\s*\/\s*Efectivo\s*\$\s*([\d.]+)/i.exec(after);
    priceClp ??= match?toClp(match[1]):null;
    const stock=/Stock web\s*\+?\s*(\d+)\s*unidades?/i.exec(after);
    if (stock && Number(stock[1])>0) availability="in_stock";
    else if (/Stock web\s*Sin stock/i.test(after)) availability="out_of_stock";
  } else if (sourceId==="greenchip") {
    const before=text.slice(Math.max(0,skuIndex-1700),skuIndex);
    const match=/\$\s*([\d.]+)\s+IVA INCLUIDO/i.exec(before);
    priceClp ??= match?toClp(match[1]):null;
    if (/Stock disponible:\s*(\d+)/i.test(before)) {
      const stock=/Stock disponible:\s*(\d+)/i.exec(before);
      availability=Number(stock?.[1])>0?"in_stock":"out_of_stock";
    }
  }
  return { priceClp, availability };
}
const CACHE_MS=10*60*1000;
let cached: Awaited<ReturnType<typeof fetchHpProduct>>|null=null;
let cachedAt=0;
let pending: Promise<Awaited<ReturnType<typeof fetchHpProduct>>>|null=null;
export async function fetchHpProduct(fetcher:typeof fetch=fetch, now=new Date()) {
  const checkedAt=now.toISOString();
  const offers=await Promise.all(HP_PRODUCT.sources.map(async (source)=>{
    let priceClp:number|null=null,availability="unknown",queryStatus="unverified";
    try {
      const response=await fetcher(source.url,{signal:AbortSignal.timeout(8000),headers:{Accept:"text/html"}});
      if (!response.ok) {
        queryStatus=response.status===403||response.status===429?"blocked":"http_error";
      } else {
        const body=await response.text();
        const parsed=parseHpOffer(body,source.sourceId);
        priceClp=parsed.priceClp;availability=parsed.availability;
        queryStatus=priceClp!==null||availability!=="unknown"?"verified":"unverified";
      }
    } catch { queryStatus="network_error"; }
    return {...source,priceClp,availability,queryStatus,checkedAt};
  }));
  const {sources:_sources,...product}=HP_PRODUCT;
  return {...product,offers,verification:summarizeVerification(offers)};
}
export async function getHpProduct() {
  if(cached&&Date.now()-cachedAt<CACHE_MS)return cached;
  if(pending)return pending;
  pending=fetchHpProduct();
  try { cached=await pending;cachedAt=Date.now();return cached; }
  finally {pending=null;}
}
