import { expect,it } from "vitest";
import { inDateRange } from "./PriceHistoryChart.jsx";
it("filters historical observations using calendar date endpoints",()=>{
 const point={checkedAt:"2026-11-15T12:30:00.000Z",priceClp:550000};
 expect(inDateRange(point,"2026-11-14","2026-11-16")).toBe(true);
 expect(inDateRange(point,"2026-11-16","2026-11-25")).toBe(false);
 expect(inDateRange(point,"","")).toBe(true);
});
