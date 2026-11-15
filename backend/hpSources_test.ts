import {strictEqual as equal,deepStrictEqual as same} from "node:assert/strict";
import {HP_PRODUCT,parseHpOffer,fetchHpProduct} from "./hpSources.ts";
Deno.test("exact HP SKU is offered by four retailers",()=>{
 equal(HP_PRODUCT.sources.length,4);
 equal(new Set(HP_PRODUCT.sources.map(x=>new URL(x.url).hostname)).size,4);
});
Deno.test("extracts Winpy's actual transfer price and available stock",()=>{
 const html='<h1>HP 250R</h1> $ 559.968 $ 768.000 Transferencia o Depósito '+
 '$ 589.440 Otros medios de pago Disponibilidad: 94 unidades en stock '+
 'Condición: NUEVO | SKU: DB9V5AT#ABM';
 same(parseHpOffer(html,"winpy"),{priceClp:559968,availability:"in_stock"});
});
Deno.test("extracts SP Digital price without claiming stock",()=>{
 const html='<p>Part number: DB9V5AT#ABM / Cod: 100109 Pago con transferencia $877.530 Otros medios de pago Stock online</p>';
 same(parseHpOffer(html,"spdigital"),{priceClp:877530,availability:"unknown"});
});
Deno.test("extracts PC Express price and web inventory",()=>{
 const html='<div>MPN: DB9V5AT#ABM Transferencia/Efectivo $549.900 Otros medios $585.000 Stock web +20 unidades</div>';
 same(parseHpOffer(html,"pcexpress"),{priceClp:549900,availability:"in_stock"});
});
Deno.test("extracts GreenChip price and inventory",()=>{
 const html='<div>HP 250R $714.990 IVA INCLUIDO Stock disponible:287 SKU:DB9V5AT#ABM</div>';
 same(parseHpOffer(html,"greenchip"),{priceClp:714990,availability:"in_stock"});
});
Deno.test("rejects a page with another SKU",()=>{
 same(parseHpOffer('<p>SKU:OTHER-PART $500.000</p>',"winpy"),{priceClp:null,availability:"unknown"});
});
Deno.test("four real sources can produce a comparable model under fixtures",async()=>{
 const pages={
 winpy:'$ 559.968 $ 768.000 Transferencia o Depósito 94 unidades en stock SKU: DB9V5AT#ABM',
 spdigital:'Part number: DB9V5AT#ABM Pago con transferencia $877.530 Stock online',
 pcexpress:'MPN: DB9V5AT#ABM Transferencia/Efectivo $549.900 Stock web +20 unidades',
 greenchip:'$714.990 IVA INCLUIDO Stock disponible:287 SKU:DB9V5AT#ABM',
 };
 const fakeFetch=async (url:string)=>{
  const source=Object.keys(pages).find(key=>url.includes(key==="pcexpress"?"pc-express":key==="greenchip"?"greenchip.cl":key==="spdigital"?"spdigital":key));
  return new Response(pages[source as keyof typeof pages]||"",{headers:{"content-type":"text/html"}});
 };
 const result=await fetchHpProduct(fakeFetch as typeof fetch,new Date("2026-11-15T12:00:00Z"));
 equal(result.verification.comparable,true);
 equal(result.verification.verifiedPrices,4);
});
