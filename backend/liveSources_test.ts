import { strictEqual as equal, deepStrictEqual as same } from "node:assert/strict";
import { PRODUCT, parseRetailPrice, fetchLiveProduct } from "./liveSources.ts";
const page = (sku: string, price: string) => '<html><h1>' + sku +
  '</h1><script type="application/ld+json">' + JSON.stringify({
    "@type": "Product", sku,
    offers: { "@type": "Offer", price, priceCurrency: "CLP" },
  }) + '</script></html>';

Deno.test("uses three distinct stores with matching SKU", () => {
  equal(PRODUCT.sources.length, 3);
  equal(new Set(PRODUCT.sources.map((source) => new URL(source.url).host)).size, 3);
});

Deno.test("parses valid CLP product prices and rejects unrelated SKUs", () => {
  equal(parseRetailPrice(page("83JC0080CL", "1.287.180"), "83JC0080CL"), 1287180);
  equal(parseRetailPrice(page("NOT-THE-SKU", "1.287.180"), "83JC0080CL"), null);
  equal(parseRetailPrice(page("83JC0080CL", "99"), "83JC0080CL"), null);
});

Deno.test("does not invent prices when a source cannot be checked", async () => {
  const fakeFetch = async (url: string) =>
    url.includes("winpy") ? new Response("Unavailable", { status: 503 }) :
      new Response(page("83JC0080CL", url.includes("centrale") ? "1287180" : "1449170"));
  const data = await fetchLiveProduct(fakeFetch as typeof fetch, new Date("2026-11-09T12:00:00.000Z"));
  same(data.offers.map((offer) => offer.priceClp), [1287180, 1449170, null]);
  equal(data.offers[0].checkedAt, "2026-11-09T12:00:00.000Z");
});
