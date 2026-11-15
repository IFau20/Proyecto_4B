import { strictEqual as equal, deepStrictEqual as same } from "node:assert/strict";
import { mergePricePoints, summarizePriceHistory } from "./history.ts";
const a = { sku: "83JC0080CL", sourceId: "spdigital", priceClp: 1000000, checkedAt: "2026-11-15T10:00:00.000Z" };
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
