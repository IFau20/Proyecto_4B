import { strictEqual as equal, deepStrictEqual as same, rejects } from "node:assert/strict";
import { mergePricePoints, summarizePriceHistory, readHistory, savePricePoints } from "./history.ts";
import { MemoryJsonStore } from "./jsonStore.ts";
const a = { sku: "83JC0080CL", sourceId: "spdigital", priceClp: 1000000, checkedAt: "2026-11-15T10:00:00.000Z" };
Deno.test("durable JSON history survives separate readers and concurrent collection writes",async()=>{
 const store=new MemoryJsonStore();
 same(await readHistory(store),{version:1,points:[]});
 await Promise.all([
  savePricePoints([a],store),
  savePricePoints([{...a,sku:"OTHER",priceClp:750000}],store),
 ]);
 same((await readHistory(store)).points.map(point=>point.sku).sort(),["83JC0080CL","OTHER"]);
});
Deno.test("unavailable durable history fails instead of silently replacing observations",async()=>{
 const store=new MemoryJsonStore();
 await store.put("history/price-history.json",{version:999,points:[]},null);
 await rejects(()=>savePricePoints([a],store),/Invalid history/);
 const value=await store.get<{version:number}>("history/price-history.json");
 equal(value?.value.version,999);
});
Deno.test("price history accepts real observations and deduplicates six hour windows", () => {
  const history = mergePricePoints({version:1,points:[]},[
    a, {...a,checkedAt:"2026-11-15T11:00:00.000Z"}, {...a,priceClp:950000,checkedAt:"2026-11-15T17:00:00.000Z"}
  ]);
  equal(history.points.length, 2);
  same(history.points.map(x=>x.priceClp),[1000000,950000]);
});
Deno.test("price history rejects fabricated or malformed prices", () => {
  const history=mergePricePoints({version:1,points:[]},[
    {...a,priceClp:-15}, {...a,priceClp:NaN}, {...a,checkedAt:"not-a-date"},a
  ]);
  equal(history.points.length,1);
});
Deno.test("history trend requires multiple dated observations", () => {
  const history=mergePricePoints({version:1,points:[]},[
    a,{...a,checkedAt:"2026-11-16T10:00:00.000Z",priceClp:900000}
  ]);
  const summary=summarizePriceHistory(history,a.sku);
  equal(summary.sources[0].changeClp,-100000);
  equal(summary.sources[0].minPrice,900000);
  equal(summarizePriceHistory(history,"other").observations,0);
});

Deno.test("history accepts manufacturer SKUs containing hash and dots",()=>{
 const h=mergePricePoints({version:1,points:[]},[
  {sku:"DB9V5AT#ABM",sourceId:"winpy",priceClp:559968,checkedAt:"2026-11-15T12:00:00Z"},
  {sku:"NH.DADAL.002.1",sourceId:"acer",priceClp:739990,checkedAt:"2026-11-15T12:00:00Z"}
 ]);
 equal(h.points.length,2);
});

Deno.test("large batches keep the newest observation per SKU and source without duplicates",()=>{
 const points=Array.from({length:500},(_,i)=>({
  sku:"SKU"+i,sourceId:"store",priceClp:600000+i,checkedAt:"2026-11-14T12:00:00Z"
 }));
 const result=mergePricePoints({version:1,points},[
  {sku:"SKU499",sourceId:"store",priceClp:700000,checkedAt:"2026-11-14T13:00:00Z"},
  {sku:"SKU499",sourceId:"other",priceClp:700000,checkedAt:"2026-11-14T13:00:00Z"},
  {sku:"SKU499",sourceId:"store",priceClp:650000,checkedAt:"2026-11-15T12:00:00Z"}
 ]);
 equal(result.points.length,502);
 equal(result.points.at(-1)?.priceClp,650000);
});
