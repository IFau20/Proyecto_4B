import { expect, it } from "vitest";
import { getPriceComparison } from "./priceComparison.js";
it("keeps real source links with missing prices but does not invent a minimum", () => {
 const offers = [
  { sourceId: "a", sourceName: "Store A", priceClp: null, url: "https://example.com/a" },
  { sourceId: "b", sourceName: "Store B", priceClp: 1200000, url: "https://example.com/b" },
  { sourceId: "c", sourceName: "Store C", priceClp: null, url: "https://example.com/c" },
 ];
 const result = getPriceComparison(offers);
 expect(result.offers).toHaveLength(3);
 expect(result.lowestPrice).toBe(1200000);
 expect(result.potentialSavings).toBe(0);
 expect(result.offers[0].sourceId).toBe("b");
});
