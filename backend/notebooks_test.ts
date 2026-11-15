import { strictEqual as equal } from "node:assert/strict";
import { NOTEBOOKS,calcDiscount,parseStorePage,buildNotebooks,getNotebookPreview } from "./notebooks.ts";
Deno.test("all catalog entries are real notebooks with unique manufacturer SKUs",()=>{
  equal(NOTEBOOKS.length>=30,true);
  equal(new Set(NOTEBOOKS.map(x=>x.sku)).size,NOTEBOOKS.length);
  equal(NOTEBOOKS.every(x=>x.ramGb>0&&x.name&&!x.name.includes("(")),true);
});
Deno.test("discount requires normal and current price from SAME retailer",()=>{
  equal(calcDiscount(799990,999990),20);
  equal(calcDiscount(800000,999990),null);
  equal(calcDiscount(null,1000000),null);
  equal(calcDiscount(999990,999990),null);
});
Deno.test("SP Digital price is based on exact model plus named transfer and normal price",()=>{
  const s="<div>Part number: D0CJ4LA#ABM</div><p>Normal $1.040.890 Descuento 19% DCTO. Pago con transferencia $842.800</p>";
  const p=parseStorePage(s,"D0CJ4LA","spdigital");
  equal(p.priceClp,842800);
  equal(p.listPriceClp,1040890);
  equal(p.discountPercent,null);
  equal(parseStorePage(s,"BA1U9LA","spdigital").priceClp,null);
});
Deno.test("Paris same product price and discount can be identified",()=>{
  const s="<h1>Samsung Galaxy Book4</h1><p>Modelo NP750XGJ-KS5CL</p><span>25% $524.990 $699.990</span>";
  const p=parseStorePage(s,"NP750XGJ-KS5CL","paris");
  equal(p.discountPercent,25);
  equal(p.priceClp,524990);
});
Deno.test("an unknown store never produces a made-up price",()=>{
  equal(parseStorePage("SKU:ABCD Oferta $400.000", "ABCD", "unknown").priceClp,null);
});

Deno.test("Ripley keeps the unrestricted Internet price, never the credit-card price",()=>{
 const html="<h1>HP 15</h1> Part Number D0CJ4LA Normal $549.990 Internet $459.990 T. Crédito $439.990 -20% Opciones de entrega Despacho a domicilio Disponible";
 const offer=parseStorePage(html,"D0CJ4LA","ripley");
 equal(offer.priceClp,459990);
 equal(offer.listPriceClp,549990);
 equal(offer.discountPercent,null);
 equal(offer.availability,"in_stock");
});

Deno.test("Paris keeps unrestricted discount but excludes the additional card discount",()=>{
 const html='<h1>Galaxy Book4 NP750XGJ-KS5CL</h1>28% $624.990 '+
 'Precio exclusivo pagando con Tarjeta Cencosud Scotiabank 27% $629.990 $869.990';
 const result=parseStorePage(html,"NP750XGJ-KS5CL","paris2");
 equal(result.priceClp,629990);
 equal(result.listPriceClp,869990);
 equal(result.discountPercent,28);
});

Deno.test("TIShop and KDTEC read SKU-matched ordinary prices and stock",()=>{
 const tishop=parseStorePage('<h1>Lenovo 82XM00M4CL</h1> $ 841.280 Por transferencia $ 878.950 Otros medios de pago (Stock: 31)',"82XM00M4CL","tishop");
 equal(tishop.priceClp,841280);
 equal(tishop.availability,"in_stock");
 const kdtec=parseStorePage('<h1>82XM00M4CL</h1> $772.681 Transferencia Bancaria $828.701 Tarjeta de Crédito o Débito Disponibilidad: EN STOCK: 64 disponibles',"82XM00M4CL","kdtec");
 equal(kdtec.priceClp,772681);
 equal(kdtec.availability,"in_stock");
 equal(parseStorePage('<p>82XM00M4CL $ 841.280 Por transferencia</p>',"83GSX029CL","tishop").priceClp,null);
});

Deno.test("expanded catalog has uniquely identified ASUS Lenovo HP Acer and Gigabyte models",()=>{
 const names=NOTEBOOKS.map(n=>n.name);
 equal(NOTEBOOKS.length,48);
 equal(new Set(NOTEBOOKS.map(n=>n.sku)).size,48);
 for(const brand of ["ASUS","Lenovo","HP","Acer","Gigabyte"]){
   equal(names.some(n=>n.startsWith(brand)),true);
 }
 equal(NOTEBOOKS.slice(-23).every(n=>n.profileUrl.includes("solotodo.cl/products/")),true);
});

Deno.test("new MSI Dell Samsung Acer and HP configurations are unique real model profiles",()=>{
 equal(NOTEBOOKS.length,48);
 for(const prefix of ["MSI","Dell","Samsung","Acer","HP"]){
   equal(NOTEBOOKS.some(n=>n.name.startsWith(prefix)),true);
 }
 equal(new Set(NOTEBOOKS.map(n=>n.sku)).size,48);
 equal(NOTEBOOKS.slice(-12).every(n=>n.profileUrl.includes("/products/")&&n.sources.length===0),true);
});

Deno.test("instant preview has all real models without claiming any live price",()=>{
 const preview=getNotebookPreview();
 equal(preview.length,NOTEBOOKS.length);
 equal(preview.every(p=>p.sku&&p.isLive&&p.verification.verifiedPrices===0),true);
 equal(preview.every(p=>p.offers.every(o=>o.priceClp===null&&o.availability==="unknown")),true);
 const published=preview.find(p=>p.sku==="NP750XGJ-KS5CL");
 equal(published?.offers.some(o=>o.referencePriceClp===629990),true);
});

Deno.test("parallel price-source pipeline keeps the catalog real and marks unavailable data",async()=>{
 const fake=async(url:string)=>{
  if(url.includes("/stores/"))return Response.json([]);
  if(url.includes("/products/available_entities/"))return Response.json({results:[]});
  return new Response("No product", {status:404});
 };
 const products=await buildNotebooks(fake as typeof fetch);
 equal(products.length,NOTEBOOKS.length);
 equal(products.every(p=>p.isLive&&p.verification.verifiedPrices===0),true);
 equal(products.every(p=>!p.offers.some(o=>Number.isSafeInteger(o.priceClp))),true);
});

Deno.test("generic catalog scraper reads exact-SKU CLP JSON-LD stock and prices",()=>{
 const sku="90NR0MU3-M00910";
 const payload=JSON.stringify({"@context":"https://schema.org","@type":"Product",sku,
  offers:{priceCurrency:"CLP",price:899990,availability:"https://schema.org/InStock"}});
 const html="<h1>"+sku+"</h1><script type=\"application/ld+json\">"+payload+"</script>";
 const result=parseStorePage(html,sku,"some-real-store");
 equal(result.priceClp,899990);
 equal(result.availability,"in_stock");
 const invalid=parseStorePage(html.replace("CLP","USD"),sku,"some-real-store");
 equal(invalid.priceClp,null);
});
Deno.test("card-only Ripley prices are not treated as normal offers",()=>{
 const sku="83JC0080CL";
 const r=parseStorePage("<h1>"+sku+"</h1> Normal $1.399.990 T. Crédito $899.990",sku,"ripley");
 equal(r.priceClp,null);
});

Deno.test("PC Factory adapter recognizes unrestricted price and online stock only",()=>{
 const sku="83JE0184CL";
 const html="<h1>"+sku+"</h1> $1.309.490 -18% Transferencia / Débito "+
   "$1.349.990 Otros medios de pago $1.599.990 Internet+100 "+
   "Disponibilidad de retiro en tienda Manuel Montt 0 unidades Huérfanos 2 unidades";
 const offer=parseStorePage(html,sku,"pcfactory");
 equal(offer.priceClp,1309490);
 equal(offer.availability,"in_stock");
 equal(offer.discountPercent,null);
});
Deno.test("two exact notebook models have a sourced PC Factory product listing",()=>{
 equal(NOTEBOOKS.find(x=>x.sku==="83JE0184CL")?.sources.some(x=>x.sourceId==="pcfactory"),true);
 equal(NOTEBOOKS.find(x=>x.sku==="NP750XGJ-KS5CL")?.sources.some(x=>x.sourceId==="pcfactory"),true);
});

Deno.test("on-demand comparison verifies three retailer responses instead of promoting public references",async()=>{
 const {verifyNotebookOffers}=await import("./notebooks.ts");
 const product={sku:"83JE0184CL",offers:[
  {sourceId:"solotodo-1",sourceName:"Winpy",url:"https://www.winpy.cl/venta/model",priceClp:null,referencePriceClp:1000000,availability:"unknown"},
  {sourceId:"solotodo-2",sourceName:"Centrale",url:"https://centrale.cl/producto/model",priceClp:null,referencePriceClp:1100000,availability:"unknown"},
  {sourceId:"solotodo-3",sourceName:"SP Digital",url:"https://www.spdigital.cl/model/",priceClp:null,referencePriceClp:1200000,availability:"unknown"},
  {sourceId:"unsafe",sourceName:"Unsafe",url:"https://127.0.0.1/private",priceClp:null,availability:"unknown"}
 ]};
 const result=await verifyNotebookOffers(product,(async(url)=>{
  if(String(url).includes("127.0.0.1"))throw Error("SSRF");
  return new Response('<h1>83JE0184CL</h1><script type="application/ld+json">'+JSON.stringify({"@type":"Product",sku:"83JE0184CL",offers:{priceCurrency:"CLP",price:999990,availability:"https://schema.org/InStock"}})+'</script>');
 }) as typeof fetch);
 equal(result.verification.verifiedPrices,3);equal(result.offers.find((o:any)=>o.sourceId==="unsafe")?.priceClp,null);
 const blocked=await verifyNotebookOffers(product,(async()=>new Response("blocked",{status:403})) as typeof fetch);
 equal(blocked.verification.verifiedPrices,0);equal(blocked.offers[0].referencePriceClp,1000000);
});
Deno.test("structured manufacturer identity can verify a product without visible SKU text",()=>{
 const html='<script type="application/ld+json">'+JSON.stringify({"@type":"Product",sku:"shop-123",mpn:"83JE0184CL",offers:{price:999990,priceCurrency:"CLP",availability:"https://schema.org/InStock"}})+'</script>';
 equal(parseStorePage(html,"83JE0184CL","eylstore").priceClp,999990);
});
Deno.test("retailer redirects cannot leave the approved retailer origin",async()=>{
 const {verifyNotebookOffers}=await import("./notebooks.ts");
 const product={sku:"83JE0184CL",offers:[{sourceId:"w",sourceName:"Winpy",url:"https://www.winpy.cl/venta/item",priceClp:null,availability:"unknown"}]};
 const html='<h1>83JE0184CL</h1><script type="application/ld+json">'+JSON.stringify({"@type":"Product",sku:"83JE0184CL",offers:{priceCurrency:"CLP",price:999990}})+'</script>';
 const result=await verifyNotebookOffers(product,(async(_url,init)=>init?.redirect==="manual"?
  new Response(null,{status:302,headers:{Location:"https://127.0.0.1/private"}}):new Response(html)) as typeof fetch);
 equal(result.verification.verifiedPrices,0);
 const canonical=await verifyNotebookOffers(product,(async(url,init)=>String(url).endsWith("/item")?
  new Response(null,{status:301,headers:{Location:"/venta/canonical"}}):new Response(html)) as typeof fetch);
 equal(canonical.verification.verifiedPrices,1);
});
