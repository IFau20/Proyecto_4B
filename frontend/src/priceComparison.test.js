import { expect, it } from "vitest";
import { getPriceComparison } from "./priceComparison.js";

const offers = [
  { sourceId: "demo-a", sourceName: "Fuente A", priceClp: 529990 },
  { sourceId: "demo-b", sourceName: "Fuente B", priceClp: 499990 },
  { sourceId: "demo-c", sourceName: "Fuente C", priceClp: 514990 },
];

it("sorts offers by price and selects the lowest", () => {
  const comparison = getPriceComparison(offers);
  expect(comparison.offers.map((offer) => offer.sourceId)).toEqual(["demo-b", "demo-c", "demo-a"]);
  expect(comparison.lowestPrice).toBe(499990);
  expect(comparison.potentialSavings).toBe(30000);
});

it("does not mutate API data when sorting", () => {
  getPriceComparison(offers);
  expect(offers[0].sourceId).toBe("demo-a");
});

it("returns zero difference when all prices match", () => {
  const comparison = getPriceComparison([
    { sourceId: "a", sourceName: "Fuente A", priceClp: 100 },
    { sourceId: "b", sourceName: "Fuente B", priceClp: 100 },
  ]);
  expect(comparison.potentialSavings).toBe(0);
});

it("ignores invalid prices and handles empty offers", () => {
  const comparison = getPriceComparison([
    { sourceId: "a", sourceName: "Fuente A", priceClp: -1 },
    { sourceId: "b", sourceName: "Fuente B", priceClp: 200 },
  ]);
  expect(comparison.offers).toHaveLength(1);
  expect(getPriceComparison(null)).toEqual({ offers: [], lowestPrice: null, potentialSavings: 0 });
});

it("keeps missing retailer prices separate and sorts numeric offers first", () => {
  const offers = [
    { sourceId: "a", sourceName: "A", priceClp: null },
    { sourceId: "b", sourceName: "B", priceClp: 1000000 },
    { sourceId: "c", sourceName: "C", priceClp: 1200000 },
  ];
  const comparison = getPriceComparison(offers);
  expect(comparison.offers.map((offer) => offer.sourceId)).toEqual(["b", "c", "a"]);
  expect(comparison.lowestPrice).toBe(1000000);
  expect(comparison.potentialSavings).toBe(200000);
});
