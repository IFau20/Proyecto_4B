import {strictEqual as equal, deepStrictEqual as same} from "node:assert/strict";
import {getPublicProductId,parsePublicPriceHistory} from "./solotodoHistory.ts";
Deno.test("extracts only exact SoloTodo numeric product IDs",()=>{
 equal(getPublicProductId("https://www.solotodo.cl/products/255552-galaxy-book4"),255552);
 equal(getPublicProductId("https://www.solotodo.cl/notebooks"),null);
 equal(getPublicProductId("https://fake.test/products/255552-galaxy"),null);
});
Deno.test("converts available dated CLP observations into multi-shop series",()=>{
 const raw=[
  {entity:{store_id:15,currency_id:1},pricing_history:[
    {timestamp:"2026-10-20T12:00:00Z",is_available:true,offer_price:"799990.00"},
    {timestamp:"2026-11-14T12:00:00Z",is_available:true,offer_price:"699990"},
    {timestamp:"2026-11-15T12:00:00Z",is_available:false,offer_price:"599990"}]},
  {entity:{store_id:22,currency_id:1},pricing_history:[
    {timestamp:"2026-10-20T12:00:00Z",is_available:true,offer_price:"849990"}]}
 ];
 // The public API can return decimal strings; noninteger values must not be fabricated.
 const result=parsePublicPriceHistory("NP750XGJ-KS5CL",raw,new Map([[15,"Paris"],[22,"Winpy"]]));
 equal(result?.source,"solotodo_public");
 equal(result?.observations,3);
 same(result?.sources.map(s=>s.sourceName),["Paris","Winpy"]);
 equal(result?.sources[0].latestPrice,699990);
});
Deno.test("returns no external history when input is empty or invalid",()=>{
 equal(parsePublicPriceHistory("SKU",{}),null);
 equal(parsePublicPriceHistory("SKU",[{entity:{store_id:1},pricing_history:[]}]),null);
});
Deno.test("archived price remains visible in history with its original date and external attribution",async()=>{
 const {historyWithFallback}=await import("./solotodoHistory.ts");
 const result=await historyWithFallback("NX.KHFAA.002","https://www.solotodo.cl/products/213040-acer",(async()=>new Response("unavailable",{status:503})) as typeof fetch,async()=>({version:1,points:[]}));
 equal(result.source,"solotodo_public");equal(result.observations,1);
 equal(result.points[0].checkedAt,"2023-08-21T05:40:56.118Z");
 equal(result.points[0].priceClp,879990);
});
