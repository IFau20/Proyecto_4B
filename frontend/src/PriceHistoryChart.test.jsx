import { expect,it } from "vitest";
import { inDateRange } from "./PriceHistoryChart.jsx";
it("filters historical observations using calendar date endpoints",()=>{
 const point={checkedAt:"2026-11-15T12:30:00.000Z",priceClp:550000};
 expect(inDateRange(point,"2026-11-14","2026-11-16")).toBe(true);
 expect(inDateRange(point,"2026-11-16","2026-11-25")).toBe(false);
 expect(inDateRange(point,"","")).toBe(true);
});

import { formatPriceAxis, collapseUnchangedPrices, priceAtTime } from "./PriceHistoryChart.jsx";
it("renders millions instead of thousands of k",()=>{
 expect(formatPriceAxis(1222000)).toBe("1.222M");
 expect(formatPriceAxis(1000000)).toBe("1M");
 expect(formatPriceAxis(880000)).toBe("880k");
});
it("shows a point only when the price changes, preserving chronological order",()=>{
 const points=[
 {checkedAt:"2026-01-03T00:00:00Z",priceClp:700000},
 {checkedAt:"2026-01-01T00:00:00Z",priceClp:700000},
 {checkedAt:"2026-01-02T00:00:00Z",priceClp:700000},
 {checkedAt:"2026-01-04T00:00:00Z",priceClp:650000},
 {checkedAt:"2026-01-05T00:00:00Z",priceClp:650000}
 ];
 const compact=collapseUnchangedPrices(points);
 expect(compact.map(p=>p.priceClp)).toEqual([700000,650000]);
 expect(priceAtTime(points,Date.parse("2026-01-03T12:00:00Z")).priceClp).toBe(700000);
 expect(priceAtTime(points,Date.parse("2026-01-05T12:00:00Z")).priceClp).toBe(650000);
});
