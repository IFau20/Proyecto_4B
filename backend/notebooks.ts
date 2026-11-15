import {ARCHIVED_PRICES} from "./archivedPrices.ts";
import {ADDITIONAL_RETAILER_LINKS} from "./retailerLinks.ts";
import {fetchPcFactoryProduct} from "./pcFactory.ts";
import {mapWithConcurrency} from "./concurrency.ts";
import {parseRetailOffer,nonNewRetailProduct} from "./liveSources.ts";
import { publicHistory } from "./solotodoHistory.ts";
import {enrichPublishedNotebookOffers} from "./solotodoCatalog.ts";
import { getLiveProduct } from "./liveSources.ts";
import { getHpProduct } from "./hpSources.ts";
import { parseAvailability } from "./liveSources.ts";
import { savePricePoints } from "./history.ts";

// All laptop identities and specifications are sourced from public manufacturer/retailer
// listings or SoloTodo product pages. Public aggregator prices are references;
// only retailer responses can establish directly verified prices and inventory.
const retailer = (sourceId: string, sourceName: string, url: string) => ({ sourceId, sourceName, url });
function sourcesForNotebook(model:{sku:string;sources:ReadonlyArray<{sourceId:string;sourceName:string;url:string}>}){
 return [...new Map([...model.sources,...(ADDITIONAL_RETAILER_LINKS[model.sku]||[])]
  .map(source=>[source.url,source])).values()];
}
export const NOTEBOOKS = [
  { sku:"83JC0080CL", name:"Lenovo LOQ 15ARP9", ramGb:24, gpu:"NVIDIA GeForce RTX 4050", processor:"AMD Ryzen 7 7435HS", kind:"legacy", sources:[], profileUrl:"https://www.solotodo.cl/products/255350-lenovo-loq-15arp9-83jc0080cl" },
  { sku:"DB9V5AT#ABM", name:"HP 250R G10", ramGb:16, gpu:"Intel Graphics", processor:"Intel Core 5 120U", kind:"hp", sources:[], profileUrl:"https://www.solotodo.cl/products/401638-hp-250r-g10-db9v5at" },
  { sku:"D0CJ4LA", name:"HP 15-fd0331la", ramGb:8, gpu:"Intel UHD Graphics", processor:"Intel Core 3 100U", sources:[
    retailer("spdigital","SP Digital","https://www.spdigital.cl/notebook-hp-15-fd0331la-156-fhd-intel-core-3-100u-8gb-ddr5-512gb-ssd-full-hd-wi-fi-6-w11-home/"),
    retailer("ripley","Ripley · tarjeta de crédito","https://simple.ripley.cl/notebook-hp-15-fd0331la-intel-core-3-8gb-ram-512gb-ssd-156-2000410726802p")
  ], profileUrl:"https://www.solotodo.cl/products/382294-hp-15-fd0331la-d0cj4la" },
  { sku:"82XM00M4CL", name:"Lenovo IdeaPad Slim 3 15ABR8", ramGb:16, gpu:"AMD Radeon Graphics", processor:"AMD Ryzen 7 5825U", sources:[
    retailer("spdigital","SP Digital","https://www.spdigital.cl/lv-ideapad-slim-3-gen-8-r7-5825u-16gb-512gb-156-fhd-tretroiluminado-abyss-blue/"),
    retailer("winpy","Winpy","https://www.winpy.cl/venta/notebook-lenovo-ideapad-slim-3-de-15-6-ryzen-7-5825u-16gb-ram-512gb-ssd-win11/"),
    retailer("tishop","TIShop","https://tishop.cl/products/notebook-lenovo-ideapad-slim-3-15abr8-15-6-amd-ryzen-7-5825u-16-gb-ram-512-gb"),
    retailer("kdtec","KDTEC","https://kdtec.cl/producto/lenovo-ideapad-slim-3-15abr8/")
  ], profileUrl:"https://www.solotodo.cl/products/269594-lenovo-ideapad-slim-3-15abr8-82xm00m4cl" },
  { sku:"BA1U9LA", name:"HP Victus 15-fb3009la", ramGb:8, gpu:"NVIDIA GeForce RTX 3050", processor:"AMD Ryzen 5 8645HS", sources:[
    retailer("spdigital","SP Digital","https://www.spdigital.cl/victus-laptop-156-fhd-nt-r58645hs-08gb-512gb-rtx305006gb-win-silver/"),
    retailer("hardwareland","HardwareLand","https://hwland.cl/p/notebook-15-ryzen-5-8gb-512gb-hp-victus-15-fb3009la"),
    retailer("tecnomas","Tecnomas","https://www.tecnomas.cl/producto/hp-victus-15-fb3009la-ba1u9la")
  ], profileUrl:"https://www.solotodo.cl/products/355283-hp-victus-15-fb3009la-ba1u9la" },
  { sku:"CH8Z6LA", name:"HP Victus 15-fb3036la", ramGb:16, gpu:"NVIDIA GeForce RTX 4050", processor:"AMD Ryzen 7 7445HS", sources:[
    retailer("spdigital","SP Digital","https://www.spdigital.cl/15-fb3036la-r7-7445h-16gb-1t-156in-w11h/"),
    retailer("sictienda","SIC Tienda","https://www.sictienda.cl/products/hp-victus-15-fb3036la"),
    retailer("tecnomas","Tecnomas","https://www.tecnomas.cl/producto/hp-victus-15-fb3036la-ch8z6la"),
    retailer("winpy","Winpy","https://www.winpy.cl/venta/notebook-gamer-hp-victus-15-fb3036la-de-15-6-ryzen-7-7445h-rtx-4050-16gb-ram-1tb-ssd-win11/")
  ], profileUrl:"https://www.solotodo.cl/products/369514-hp-victus-15-fb3036la-ch8z6la" },
  { sku:"NP750XGJ-KS5CL", name:"Samsung Galaxy Book4", ramGb:16, gpu:"Intel Iris Xe Graphics", processor:"Intel Core i5-1335U", sources:[
    retailer("pcfactory","PC Factory","https://www.pcfactory.cl/producto/53661"),
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
    profileUrl:"https://www.solotodo.cl/products/280353-lenovo-loq-15iax9-83gsx013cl" },
  { sku:"83LY003NCL", name:"Lenovo Legion 5 15IRX10", ramGb:32, gpu:"NVIDIA GeForce RTX 5070", processor:"Intel Core i9-14900HX", sources:[
    retailer("spdigital","SP Digital","https://www.spdigital.cl/lenovo-legion-5-gen-10-intel-core-i9-14900hx-32gb-1tb-ssd-nvidia-rtx-5070-oled-165hz-151-w11/"),
    retailer("winpy","Winpy","https://www.winpy.cl/venta/notebook-gamer-lenovo-legion-5i-de-15-1-i9-14900hx-rtx-5070-32gb-ddr5-1tb-ssd-win11/"),
    retailer("falabella","Falabella","https://www.falabella.com/falabella-cl/product/17500183/Notebook-Gamer-Legion-5%2520i9-14900HX-32GB-RAM-1TB-SSD-RTX-5070-8GB-15.1%2522%2520WQXGA-OLED-165Hz-Lenovo/17500183")
  ], profileUrl:"https://www.solotodo.cl/notebooks" },
  { sku:"D62W3LA", name:"HP Omen HyperX 15-ga0001la", ramGb:16, gpu:"NVIDIA GeForce RTX 5060", processor:"Intel Core i7-14650HX", sources:[],
    profileUrl:"https://www.solotodo.cl/products/391295-hp-omen-hyperx-15-ga0001la-d62w3la" },
  { sku:"90NR0QF3-M003Y0",name:"ASUS TUF Gaming A16 FA607NUQ-RL060W",ramGb:16,gpu:"NVIDIA GeForce RTX 4050",processor:"AMD Ryzen 7 170",sources:[],profileUrl:"https://www.solotodo.cl/products/400059-asus-tuf-gaming-a16-fa607nuq-rl060w-90nr0qf3-m003y0" },
  { sku:"90NR0MU3-M00910",name:"ASUS TUF Gaming A16 FA607NUG-RL146W",ramGb:16,gpu:"NVIDIA GeForce RTX 4050",processor:"AMD Ryzen 7 7445HS",sources:[],profileUrl:"https://www.solotodo.cl/products/354889-asus-tuf-gaming-a16-fa607nug-rl146w-90nr0mu3-m00910" },
  { sku:"90NR0QE7-M000T0",name:"ASUS TUF A15 FA506NCQ-HN020W",ramGb:8,gpu:"NVIDIA GeForce RTX 3050",processor:"AMD Ryzen 7 170",sources:[],profileUrl:"https://www.solotodo.cl/products/389222-asus-tuf-a15-fa506ncq-hn020w-90nr0qe7-m000t0" },
  { sku:"90NR0MZ6-M001N0",name:"ASUS TUF F16 FX607VJ-RL028W",ramGb:8,gpu:"NVIDIA GeForce RTX 3050",processor:"Intel Core 5 210H",sources:[],profileUrl:"https://www.solotodo.cl/products/277732-asus-tuf-f16-fx607vj-rl028w-90nr0mz6-m001n0" },
  { sku:"90NB13U2-M00T50",name:"ASUS VivoBook 14 X1404VA-EB1660W",ramGb:8,gpu:"Intel Iris Xe Graphics",processor:"Intel Core 5 120U",sources:[],profileUrl:"https://www.solotodo.cl/products/378179-asus-vivobook-14-x1404va-eb1660w-90nb13u2-m00t50" },
  { sku:"90NB13Y1-M01V70",name:"ASUS VivoBook 15 X1504VA-BQ4206W",ramGb:16,gpu:"Intel Iris Xe Graphics",processor:"Intel Core 5 120U",sources:[],profileUrl:"https://www.solotodo.cl/products/378185-asus-vivobook-15-x1504va-bq4206w-90nb13y1-m01v70" },
  { sku:"83DV016GCL",name:"Lenovo LOQ 15IRX9 i7 RTX 3050",ramGb:24,gpu:"NVIDIA GeForce RTX 3050",processor:"Intel Core i7-13650HX",sources:[],profileUrl:"https://www.solotodo.cl/products/279972-lenovo-loq-15irx9-83dv016gcl" },
  { sku:"83DV00FXUS",name:"Lenovo LOQ 15IRX9 i7 RTX 4060",ramGb:16,gpu:"NVIDIA GeForce RTX 4060",processor:"Intel Core i7-13650HX",sources:[],profileUrl:"https://www.solotodo.cl/products/245532-lenovo-loq-15irx9-83dv00fxus" },
  { sku:"83DV00FYUS",name:"Lenovo LOQ 15IRX9 i5 RTX 4050",ramGb:12,gpu:"NVIDIA GeForce RTX 4050",processor:"Intel Core i5-13450HX",sources:[],profileUrl:"https://www.solotodo.cl/products/266605-lenovo-loq-15irx9-83dv00fyus" },
  { sku:"83DV009MUS",name:"Lenovo LOQ 15IRX9 i5 RTX 4060",ramGb:16,gpu:"NVIDIA GeForce RTX 4060",processor:"Intel Core i5-13450HX",sources:[],profileUrl:"https://www.solotodo.cl/products/263303-lenovo-loq-15irx9-83dv009mus" },
  { sku:"83JE0184CL",name:"Lenovo LOQ 15IRX10",ramGb:16,gpu:"NVIDIA GeForce RTX 5050",processor:"Intel Core i7-13645HX",sources:[retailer("pcfactory","PC Factory","https://www.pcfactory.cl/producto/55428")],profileUrl:"https://www.solotodo.cl/products/386070-lenovo-loq-15irx10-83je0184cl" },
  { sku:"21SR00B8CL",name:"Lenovo ThinkPad E16 Gen 3",ramGb:16,gpu:"Intel Arc Graphics 140T",processor:"Intel Core Ultra 7 255H",sources:[],profileUrl:"https://www.solotodo.cl/products/392512-lenovo-thinkpad-e16-gen-3-intel-21sr00b8cl" },
  { sku:"82XQ005VCL",name:"Lenovo IdeaPad Slim 3 15AMN8",ramGb:8,gpu:"AMD Radeon 610M",processor:"AMD Ryzen 3 7320U",sources:[],profileUrl:"https://www.solotodo.cl/products/201341-lenovo-ideapad-slim-3-15amn8-82xq005vcl" },
  { sku:"BV5C6LA",name:"HP Victus 15-fb3026la",ramGb:16,gpu:"NVIDIA GeForce RTX 3050",processor:"AMD Ryzen 7 7445HS",sources:[],profileUrl:"https://www.solotodo.cl/products/375076-hp-victus-15-fb3026la-bv5c6la" },
  { sku:"A14LPLA",name:"HP Victus 15-fb2019la",ramGb:16,gpu:"NVIDIA GeForce RTX 4050",processor:"AMD Ryzen 7 8845HS",sources:[],profileUrl:"https://www.solotodo.cl/products/269653-hp-victus-15-fb2019la-a14lpla" },
  { sku:"BF9V4LA",name:"HP Victus 15-fb3013la",ramGb:16,gpu:"NVIDIA GeForce RTX 4050",processor:"AMD Ryzen 7 8845HS",sources:[],profileUrl:"https://www.solotodo.cl/products/355424-hp-victus-15-fb3013la-bf9v4la" },
  { sku:"BV5C1LA",name:"HP Victus 15-fb3027la",ramGb:16,gpu:"NVIDIA GeForce RTX 4050",processor:"AMD Ryzen 7 7445HS",sources:[],profileUrl:"https://www.solotodo.cl/products/384795-hp-victus-15-fb3027la-bv5c1la" },
  { sku:"BK9L9LA",name:"HP Victus 15-fa2018la",ramGb:8,gpu:"NVIDIA GeForce RTX 4050",processor:"Intel Core i5-13420H",sources:[],profileUrl:"https://www.solotodo.cl/products/357335-hp-victus-15-fa2018la-bk9l9la" },
  { sku:"BA1U5LA",name:"HP Victus 15-fa2014la",ramGb:16,gpu:"NVIDIA GeForce RTX 3050",processor:"Intel Core i5-13420H",sources:[],profileUrl:"https://www.solotodo.cl/products/279679-hp-victus-15-fa2014la-ba1u5la" },
  { sku:"NH.DAHAL.003.1",name:"Acer Nitro Lite NL16-71G-50GH-1",ramGb:16,gpu:"NVIDIA GeForce RTX 4050",processor:"Intel Core i5-13420H",sources:[],profileUrl:"https://www.solotodo.cl/products/357476-acer-nitro-lite-16-nl16-71g-50gh-1-nhdahal0031" },
  { sku:"3THK3LA893PD",name:"Gigabyte Gaming A16 3TH",ramGb:16,gpu:"NVIDIA GeForce RTX 5050",processor:"AMD Ryzen 7 260",sources:[],profileUrl:"https://www.solotodo.cl/products/378949-gigabyte-gaming-a16-3th-3thk3la893pd" },
  { sku:"5VHP3LA893SH",name:"Gigabyte Gaming A16 5VH",ramGb:16,gpu:"NVIDIA GeForce RTX 5060",processor:"AMD Ryzen 7 170",sources:[],profileUrl:"https://www.solotodo.cl/products/412829-gigabyte-gaming-a16-5vh-5vhp3la893sh" },
  { sku:"C2DA0LA",name:"HP Omen 16-ap0007la",ramGb:24,gpu:"NVIDIA GeForce RTX 5070",processor:"AMD Ryzen 9 8940HX",sources:[],profileUrl:"https://www.solotodo.cl/products/378901-hp-omen-16-ap0007la-c2da0la" },
  { sku:"12VE-068US",name:"MSI GF63 Thin 12VE",ramGb:16,gpu:"NVIDIA GeForce RTX 4050",processor:"Intel Core i5-12450H",sources:[],profileUrl:"https://www.solotodo.cl/products/210618-msi-gf63-thin-12ve-12ve-068us" },
  { sku:"12VE-066US",name:"MSI GF63 Thin 12VE i7",ramGb:16,gpu:"NVIDIA GeForce RTX 4050",processor:"Intel Core i7-12650H",sources:[],profileUrl:"https://www.solotodo.cl/products/206182-msi-gf63-thin-12ve-12ve-066us" },
  { sku:"B6ML4LA",name:"HP Victus 15-fb3004la",ramGb:16,gpu:"NVIDIA GeForce RTX 4060",processor:"AMD Ryzen 9 8945HS",sources:[],profileUrl:"https://www.solotodo.cl/products/357336-hp-victus-15-fb3004la-b6ml4la" },
  { sku:"NKWWG",name:"Dell Inspiron 16 5640",ramGb:16,gpu:"NVIDIA GeForce MX570",processor:"Intel Core 7 150U",sources:[],profileUrl:"https://www.solotodo.cl/products/268486-dell-inspiron-16-5640-nkwwg" },
  { sku:"NX.KHFAA.002",name:"Acer Aspire 5 A515-58M-54LG",ramGb:16,gpu:"Intel Iris Xe Graphics",processor:"Intel Core i5-1335U",sources:[],profileUrl:"https://www.solotodo.cl/products/213040-acer-aspire-5-a515-58m-54lg-nxkhfaa002" },
  { sku:"NP750XGJ-KS2CL",name:"Samsung Galaxy Book4 Core i7",ramGb:16,gpu:"Intel Iris Xe Graphics",processor:"Intel Core i7-1355U",sources:[],profileUrl:"https://www.solotodo.cl/products/255555-samsung-galaxy-book4-silver-np750xgj-ks2cl" },
  { sku:"CYBORG15AIA1VE",name:"MSI Cyborg 15 AI A1VE",ramGb:16,gpu:"NVIDIA GeForce RTX 4050",processor:"Intel Core Ultra 7 155H",sources:[],profileUrl:"https://www.solotodo.cl/products/252356-msi-cyborg-15-ai-a1ve-ultra-7-155h-16-gb-512-gb-ssd-rtx-4050-6-gb-w11h-cyborg15aia1ve" },
  { sku:"NX.KN3AL.00Q.1",name:"Acer Aspire 5 A515-57",ramGb:16,gpu:"Intel UHD Graphics",processor:"Intel Core i5-12450H",sources:[],profileUrl:"https://www.solotodo.cl/products/241301-acer-aspire-5-a515-57-58f6-1-nxkn3al00q1" },
  { sku:"A1UD0LA",name:"HP Pavilion 15-eh3002la",ramGb:16,gpu:"AMD Radeon Vega 8",processor:"AMD Ryzen 7 7730U",sources:[],profileUrl:"https://www.solotodo.cl/products/246421-hp-pavilion-15-eh3002la-a1ud0la" },
  { sku:"CYBORG1513218",name:"MSI Cyborg 15 A13VE",ramGb:16,gpu:"NVIDIA GeForce RTX 4050",processor:"Intel Core i7-13620H",sources:[],profileUrl:"https://www.solotodo.cl/products/245785-msi-cyborg-15-a13ve-218us-cyborg1513218" },
  { sku:"A32VHUA",name:"HP Pavilion 16-ag0010ca",ramGb:16,gpu:"AMD Radeon 780M",processor:"AMD Ryzen 7 PRO 8840U",sources:[],profileUrl:"https://www.solotodo.cl/products/269756-hp-pavilion-16-ag0010ca-a32vhua" },
  { sku:"THIN15131451",name:"MSI Thin 15 B13VE",ramGb:16,gpu:"NVIDIA GeForce RTX 4050",processor:"Intel Core i5-13420H",sources:[],profileUrl:"https://www.solotodo.cl/products/257395-msi-thin-15-b13ve-1451us-thin15131451" },
] as const;


// References are actual prices published by the linked retailers, not live scraper results.
// Only the dated, recent Paris offer is eligible for the carousel as a published promotion.
// Other reference values are unverified and may have changed. Never save them as historical observations.
const PUBLIC_REFERENCES: Record<string, Record<string, {
  priceClp:number; normalPriceClp?:number; observedOn?:string; condition?:string;
}>> = {
  "NP750XGJ-KS5CL":{
    paris2:{priceClp:629990,normalPriceClp:869990,observedOn:"2026-11-15"}
  },
  "D0CJ4LA":{
    ripley:{priceClp:439990,normalPriceClp:549990,condition:"Tarjeta de crédito Ripley"},
    spdigital:{priceClp:842800,normalPriceClp:1040890}
  },
  "82XM00M4CL":{spdigital:{priceClp:804450,normalPriceClp:993520}},
  "BA1U9LA":{spdigital:{priceClp:1296230}},
  "CH8Z6LA":{spdigital:{priceClp:1699990}},
  "83LY003NCL":{
    winpy:{priceClp:2681280},
    spdigital:{priceClp:2849990},
    falabella:{priceClp:2299990}
  },
  "DB9V5AT#ABM":{
    winpy:{priceClp:559968},
    pcexpress:{priceClp:539900},
    spdigital:{priceClp:877530}
  }
};

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
  if(nonNewRetailProduct(html,sku))return empty;
  const structured=parseRetailOffer(html,sku,sourceId);
  if(!productIdentifierPresent(html,sku)) return {...empty,...structured};
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
    const price=/\$\s*([\d.]+)\s*Transferencia o Dep[oó]sito/i.exec(text);
    priceClp=parsedMoney(price?.[1]||"");
    if(/\d+\s+unidades?\s+en\s+stock/i.test(text)) availability="in_stock";
  } else if(sourceId==="tishop"){
    const transfer=/\$\s*([\d.]+)\s*Por transferencia/i.exec(text);
    priceClp=parsedMoney(transfer?.[1]||"");
    const stock=/\(Stock\s*:\s*(\d+)\)/i.exec(text);
    if(stock)availability=Number(stock[1])>0?"in_stock":"out_of_stock";
  } else if(sourceId==="kdtec"){
    const transfer=/\$\s*([\d.]+)\s*Transferencia Bancaria/i.exec(text);
    priceClp=parsedMoney(transfer?.[1]||"");
    const stock=/EN STOCK\s*:\s*(\d+)/i.exec(text);
    if(stock)availability=Number(stock[1])>0?"in_stock":"out_of_stock";
  } else if(sourceId==="pcfactory"){
    // Price for transfer/debit is the publicly displayed unrestricted amount;
    // an associated credit-card price is never used in this branch.
    const transfer=/\$\s*([\d.]+)\s*(?:-\d{1,2}%\s*)?Transferencia\s*\/\s*D[eé]bito/i.exec(text);
    priceClp=parsedMoney(transfer?.[1]||"");
    const internet=/\bInternet\s*\+?\s*(\d{1,5})\b/i.exec(text);
    if(internet)availability=Number(internet[1])>0?"in_stock":"out_of_stock";
    if(/Producto no disponible/i.test(text.slice(0,1000)))availability="out_of_stock";
  } else if(sourceId==="ripley"){
    const normal=/\bNormal\s*\$?\s*([\d.]+)/i.exec(text);
    // "Internet" is the unrestricted price. Credit-card offers are separate.
    const standard=/\bInternet\s*\$?\s*([\d.]+)/i.exec(text);
    priceClp=parsedMoney(standard?.[1]||"");
    listPriceClp=parsedMoney(normal?.[1]||"");
    // Credit-card-only prices are identified explicitly in the source name.
    if(/Despacho a domicilio\s+Disponible/i.test(text))availability="in_stock";
  } else if(sourceId==="paris"||sourceId==="paris2"){
    // Only accept page prices when model appears in the same published product document.
    // Ignore the bank-card figure and capture the following unrestricted
    // retailer price + normal price. Never present the card-only price as a deal.
    const cardThenRegular=/Precio exclusivo pagando con Tarjeta[^0-9]*\d{1,2}%\s*\$\s*([\d.]+)\s*\$\s*([\d.]+)/i.exec(text);
    if(cardThenRegular){
      priceClp=parsedMoney(cardThenRegular[1]);
      listPriceClp=parsedMoney(cardThenRegular[2]);
    } else if(!/Precio exclusivo pagando con Tarjeta/i.test(text)){
      const ordinary=/(\d{1,2})%\s*\$\s*([\d.]+)\s*\$\s*([\d.]+)/i.exec(text);
      if(ordinary){priceClp=parsedMoney(ordinary[2]);listPriceClp=parsedMoney(ordinary[3]);}
    }
    if(/Sin stock|Producto agotado|Justo se agot[oó]/i.test(text)) availability="out_of_stock";
  }
  // Many retailers publish standardized product JSON-LD even when their visible
  // price layout differs. Only accept it after exact SKU and CLP validation.
  priceClp??=structured.priceClp;
  if(availability==="unknown")availability=structured.availability;
  // A known card-only price never becomes the unrestricted advertised price.
  // For Ripley, structured prices are only accepted if there is no card
  // promotion in the text; otherwise the standard Internet price is authoritative.
  if(sourceId==="ripley"&&/T\.\s*Cr[eé]dito/i.test(text)){
    priceClp=parsedMoney(/\bInternet\s*\$?\s*([\d.]+)/i.exec(text)?.[1]||"");
  }
  return {...empty,priceClp,listPriceClp,discountPercent:calcDiscount(priceClp,listPriceClp),availability};
}
const LIMIT_MS=7500;
async function fetchRetailerPage(url:string,fetcher:typeof fetch){
  const initial=new URL(url);
  const host=initial.hostname.replace(/^www\./,"");
  let current=initial;
  const signal=AbortSignal.timeout(LIMIT_MS);
  for(let redirects=0;redirects<=3;redirects++){
    const response=await fetcher(current.href,{signal,redirect:"manual",headers:{Accept:"text/html"}});
    if(![301,302,303,307,308].includes(response.status))return response;
    const location=response.headers.get("Location");
    await response.body?.cancel();
    if(!location)throw Error("Missing retailer redirect");
    const next=new URL(location,current);
    if(next.protocol!=="https:"||next.hostname.replace(/^www\./,"")!==host||
      next.port||next.username||next.password)throw Error("Retailer redirect left trusted origin");
    current=next;
  }
  throw Error("Too many retailer redirects");
}
async function fetchSource(model:typeof NOTEBOOKS[number],source:{sourceId:string;sourceName:string;url:string},fetcher:typeof fetch,checkedAt:string) {
  let details= {priceClp:null as number|null,listPriceClp:null as number|null,
    discountPercent:null as number|null,availability:"unknown",imageUrl:null as string|null };
  let queryStatus="unverified";
  try{
    if(source.sourceId==="pcfactory"){
      const api=await fetchPcFactoryProduct(source.url,model.sku,fetcher);
      if(api&&(api.priceClp!==null||api.availability!=="unknown"))return {...source,...details,
        priceClp:api.priceClp,listPriceClp:api.listPriceClp,availability:api.availability,
        paymentMethod:"transfer",discountPercent:calcDiscount(api.priceClp,api.listPriceClp),queryStatus:"verified",checkedAt:api.checkedAt};
    }
    const response=await fetchRetailerPage(source.url,fetcher);
    if(!response.ok){queryStatus=[403,429].includes(response.status)?"blocked":"http_error";}
    else {
      const html=await response.text();
      details=parseStorePage(html,model.sku,source.sourceId);
      // An image is attached only to the page for the validated model.
      if(productIdentifierPresent(html,model.sku)) details.imageUrl=metaImage(html,source.url);
      queryStatus=details.priceClp!==null||details.availability!=="unknown"?"verified":"unverified";
    }
  }catch{queryStatus="network_error";}
  return {...source,...details,queryStatus,checkedAt,
    ...(source.sourceId==="ripley"&&details.priceClp!==null?{sourceName:"Ripley",paymentCondition:null,condition:null}: {})};
}
let catalogCache:Awaited<ReturnType<typeof buildNotebooks>>|null=null;
let cacheAt=0, pending:Promise<Awaited<ReturnType<typeof buildNotebooks>>>|null=null;
export async function buildNotebooks(fetcher:typeof fetch=fetch,now=new Date()) {
  const legacyPromise=fetcher===fetch
    ? Promise.allSettled([getLiveProduct(),getHpProduct()])
    : Promise.allSettled([Promise.resolve(null),Promise.resolve(null)]);
  const base=NOTEBOOKS.map((model,index)=>({
    id:"notebook-"+index,sku:model.sku,name:model.name,ramGb:model.ramGb,
    gpu:model.gpu,processor:model.processor,isLive:true,
    profileUrl:"profileUrl" in model?model.profileUrl:null,
    imageUrl:null as string|null,historicalPriceClp:ARCHIVED_PRICES[model.sku]?.priceClp??null,
    historicalObservedAt:ARCHIVED_PRICES[model.sku]?.checkedAt??null,offers:[] as any[],verification:null as any
  }));
  const time=now.toISOString();
  const jobs:Array<{index:number;model:typeof NOTEBOOKS[number];source:{sourceId:string;sourceName:string;url:string}}>=[];
  for(let i=0;i<NOTEBOOKS.length;i++){
    const model=NOTEBOOKS[i];
    for(const source of sourcesForNotebook(model))jobs.push({index:i,model,source});
  }
  // Price feed and retailer scrapers can run independently. We use separate
  // arrays so price references never overwrite directly checked retailer offers.
  const publishedBase=base.map(product=>({...product,offers:[] as any[]}));
  const publicPromise=enrichPublishedNotebookOffers(publishedBase,fetcher);
  const scrapePromise=mapWithConcurrency(jobs,6,async job=>
    fetchSource(job.model,job.source,fetcher,time));
  const [settledLegacy,checked]=await Promise.all([legacyPromise,scrapePromise]);
  const [lenovo,hp]=settledLegacy;
  for(let i=0;i<NOTEBOOKS.length;i++){
    const model=NOTEBOOKS[i];
    if("kind" in model&&model.kind==="legacy"&&lenovo.status==="fulfilled"&&lenovo.value){
      base[i].offers=lenovo.value.offers.map(({referencePriceClp:_r,...offer}:any)=>offer);
    }else if("kind" in model&&model.kind==="hp"&&hp.status==="fulfilled"&&hp.value){
      base[i].offers=hp.value.offers.map(({referencePriceClp:_r,referenceType:_rt,...offer}:any)=>offer);
    }
  }
  checked.forEach((offer,i)=>base[jobs[i].index].offers.push(offer));
  // Unverified published references are attached separately; they never populate priceClp.
  for(const notebook of base){
    const references=PUBLIC_REFERENCES[notebook.sku]??{};
    notebook.offers=notebook.offers.map((offer:any)=>{
      const published=references[offer.sourceId];
      if(!published)return offer;
      const percentage=published.normalPriceClp
        ? calcDiscount(published.priceClp,published.normalPriceClp) : null;
      return {...offer,referencePriceClp:published.priceClp,
        referenceNormalPriceClp:published.normalPriceClp??null,
        referenceDiscountPercent:percentage,
        referenceObservedOn:published.observedOn??null,
        paymentCondition:published.condition??null};
    });
  }
  // Fill genuine models lacking store links from public current listings.
  // Prices are references only and do not enter the local verified-price history.
  await publicPromise;
  for(let i=0;i<base.length;i++){
    if(!base[i].imageUrl)base[i].imageUrl=publishedBase[i].imageUrl;
    for(const offer of publishedBase[i].offers){
      // Preserve the historical behavior: a direct retailer source wins over
      // a duplicate aggregator store record for the same SKU.
      const duplicate=base[i].offers.some(existing=>
        String(existing.sourceName||"").toLowerCase()
          .includes(String(offer.sourceName||"").toLowerCase()));
      if(!duplicate)base[i].offers.push(offer);
    }
  }
  // Image metadata never constitutes evidence of a price or product discount.
  await mapWithConcurrency(base,8,async (p)=>{
    p.imageUrl=p.imageUrl??p.offers.find(o=>o.imageUrl)?.imageUrl??null;
    if(p.imageUrl || !p.profileUrl || !p.profileUrl.includes("/products/"))return;
    try{
      const response=await fetcher(p.profileUrl,{signal:AbortSignal.timeout(4500)});
      if(response.ok){
        const html=await response.text();
        const normalizedSku=p.sku.replace(/[^a-z0-9]/gi,"").toLowerCase();
        const normalizedUrl=p.profileUrl.replace(/[^a-z0-9]/gi,"").toLowerCase();
        if(productIdentifierPresent(html,p.sku)||normalizedUrl.includes(normalizedSku))p.imageUrl=metaImage(html,p.profileUrl);
      }
    }catch{}
  });

  // For unavailable models, the historical figure is only a last recorded
  // observation, never a live offer, discount or proof of current stock.
  // Tests with injected network adapters do not make requests to the live API.
  if(fetcher===fetch){
    await mapWithConcurrency(base.filter(p=>p.profileUrl?.includes("/products/") &&
      !p.offers.some(o=>Number.isSafeInteger(o.priceClp)||Number.isSafeInteger(o.referencePriceClp)))
      ,3,async product=>{
        try{
          const historic=await publicHistory(product.profileUrl!,product.sku,fetcher);
          const latest=historic?.points?.filter(pt=>Number.isSafeInteger(pt.priceClp))
            .sort((a,b)=>Date.parse(b.checkedAt)-Date.parse(a.checkedAt))[0];
          if(latest && Date.parse(latest.checkedAt)>Date.now()-365*86400000){
            product.historicalPriceClp=latest.priceClp;
            product.historicalObservedAt=latest.checkedAt;
          }
        }catch{/* No historical data is safer than a guessed current price. */}
      });
  }
  for(const p of base){
    p.verification={
      totalSources:p.offers.length,
      verifiedPrices:p.offers.filter(o=>o.priceClp!==null).length,
      verifiedStocks:p.offers.filter(o=>o.availability!=="unknown").length
    };
  }
  return base;
}
// This is an immediate catalog response with real specifications and
// only the retailer's previously published reference values. No calls to
// stores, historical APIs or image hosts occur on the critical path.
const PREVIEW=NOTEBOOKS.map((model,index)=>{
  const offers=sourcesForNotebook(model).map(source=>{
    const published=PUBLIC_REFERENCES[model.sku]?.[source.sourceId];
    return {
      ...source,
      priceClp:null as number|null,
      listPriceClp:null as number|null,
      discountPercent:null as number|null,
      availability:"unknown",
      imageUrl:null as string|null,
      checkedAt:null as string|null,
      queryStatus:"pending",
      referencePriceClp:published?.priceClp??null,
      referenceNormalPriceClp:published?.normalPriceClp??null,
      referenceDiscountPercent:published?.normalPriceClp
        ?calcDiscount(published.priceClp,published.normalPriceClp):null,
      referenceObservedOn:published?.observedOn??null,
      paymentCondition:published?.condition??null
    };
  });
  return {
    id:"notebook-"+index,sku:model.sku,name:model.name,
    ramGb:model.ramGb,gpu:model.gpu,processor:model.processor,
    isLive:true,profileUrl:model.profileUrl,
    imageUrl:null as string|null,historicalPriceClp:ARCHIVED_PRICES[model.sku]?.priceClp??null,
    historicalObservedAt:ARCHIVED_PRICES[model.sku]?.checkedAt??null,
    offers,verification:{totalSources:offers.length,verifiedPrices:0,verifiedStocks:0}
  };
});
export function getNotebookPreview() {
  // The most recent full snapshot is always preferable to the static preview.
  return catalogCache ?? PREVIEW;
}

const CACHE_TTL=15*60*1000;
function refreshCatalog() {
  if(pending)return pending;
  pending=buildNotebooks().then(value=>{
    catalogCache=value;cacheAt=Date.now();return value;
  }).finally(()=>{pending=null;});
  // On stale refresh the caller receives cached data; errors must still be observed.
  void pending.catch(e=>console.error("Catalog refresh failed; stale data preserved",e));
  return pending;
}
export async function getNotebooks() {
  if(catalogCache){
    if(Date.now()-cacheAt>=CACHE_TTL)void refreshCatalog();
    return catalogCache;
  }
  return refreshCatalog();
}
// The second, optional request waits for a completed refresh, but never
// blocks the fast preview endpoint. In-flight work is reused across visitors.
export async function getFreshNotebooks() {
  if(pending)return pending;
  if(catalogCache&&Date.now()-cacheAt<CACHE_TTL)return catalogCache;
  return refreshCatalog();
}
export async function collectNotebookHistory() {
  const products=await getFreshNotebooks();
  const points=products.flatMap(product=>product.offers
    .filter(offer=>Number.isSafeInteger(offer.priceClp)&&offer.priceClp>0&&
      offer.availability!=="out_of_stock"&&typeof offer.checkedAt==="string")
    .map(offer=>({sku:product.sku,sourceId:offer.sourceId,
      priceClp:offer.priceClp,checkedAt:offer.checkedAt})));
  try{await savePricePoints(points);}
  catch(error){console.error("Unable to persist notebook price observations",error);}
}

// Recheck public product links on demand; unknown hosts never become server-side requests.
const RETAILER_HOSTS:Record<string,string>={
 "spdigital.cl":"spdigital","winpy.cl":"winpy","centrale.cl":"centrale",
 "pcfactory.cl":"pcfactory","simple.ripley.cl":"ripley","paris.cl":"paris",
 "tienda.pc-express.cl":"pcexpress","greenchip.cl":"greenchip","tishop.cl":"tishop",
 "eylstore.cl":"eylstore","kdtec.cl":"kdtec","notebookstore.cl":"notebookstore","falabella.com":"falabella",
 "hp.com":"hp","asus.com":"asus","tecnomas.cl":"tecnomas","smartdeal.cl":"smartdeal",
 "ctman.cl":"ctman","bip.cl":"bip","ultrapc.cl":"ultrapc","gamingx.cl":"gamingx","rumbochile.cl":"rumbochile"
};
const verifiedNotebookCache=new Map<string,{at:number;result:any}>();
const pendingVerifications=new Map<string,Promise<any>>();
export async function verifyNotebookOffers(product:{sku:string;offers:any[]},fetcher:typeof fetch=fetch){
 const known=NOTEBOOKS.find(p=>p.sku===product.sku);
 if(!known)throw Error("Unknown notebook SKU");
 const cache=verifiedNotebookCache.get(product.sku);
 if(fetcher===fetch&&cache&&Date.now()-cache.at<10*60*1000)return cache.result;
 if(fetcher===fetch&&pendingVerifications.has(product.sku))return pendingVerifications.get(product.sku)!;
 const work=(async()=>{
  const checkedAt=new Date().toISOString();
  const offers=await mapWithConcurrency(product.offers,4,async offer=>{
   let sourceId:string|undefined;
   try{const url=new URL(offer.url);if(url.protocol!=="https:"||url.port||url.username||url.password)return offer;
    sourceId=RETAILER_HOSTS[url.hostname.replace(/^www\./,"")];
   }catch{return offer;}
   if(!sourceId)return offer;
   const result=await fetchSource(known,{...offer,sourceId},fetcher,checkedAt);
   return {...offer,...result,sourceId:offer.sourceId};
  });
  const domains=new Set(offers.filter(o=>Number.isSafeInteger(o.priceClp)).map(o=>new URL(o.url).hostname.replace(/^www\./,"")));
  const result={sku:product.sku,offers,verification:{totalSources:offers.length,
    verifiedPrices:offers.filter(o=>Number.isSafeInteger(o.priceClp)).length,
    verifiedStocks:offers.filter(o=>o.availability!=="unknown").length,
    verifiedRetailers:domains.size,comparable:domains.size>=3},checkedAt};
  if(fetcher===fetch)verifiedNotebookCache.set(product.sku,{at:Date.now(),result});
  return result;
 })().finally(()=>pendingVerifications.delete(product.sku));
 if(fetcher===fetch)pendingVerifications.set(product.sku,work);return work;
}
