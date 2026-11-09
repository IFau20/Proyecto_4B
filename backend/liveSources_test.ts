import { deepStrictEqual as same, strictEqual as equal } from "node:assert/strict";
import { PRODUCT, parseRetailOffer, parseRetailPrice, parseAvailability, summarizeVerification, fetchLiveProduct } from "./liveSources.ts";
const script = (sku: string, price: string | number, stock: string) =>
  '<script data-id="p" type="application/ld+json">' +
  JSON.stringify({ "@type": "Product", sku, offers: { priceCurrency: "CLP", price, availability: stock } }) +
  '</script>';

Deno.test("uses three distinct retailer domains for the same SKU", () => {
  equal(PRODUCT.sources.length, 3);
  equal(new Set(PRODUCT.sources.map((entry) => new URL(entry.url).host)).size, 3);
});
Deno.test("reads a JSON-LD price and stock only for the exact SKU", () => {
  same(parseRetailOffer(script("83JC0080CL", "1.449.170", "https://schema.org/InStock"), PRODUCT.sku),
    { priceClp: 1449170, availability: "in_stock" });
  same(parseRetailOffer("83JC0080CL" + script("OTHER-SKU", 1234567, "https://schema.org/InStock"), PRODUCT.sku),
    { priceClp: null, availability: "unknown" });
});
Deno.test("ignores wrong currency and implausible prices", () => {
  equal(parseRetailPrice(script("83JC0080CL", "999.999.999", ""), PRODUCT.sku), null);
  same(parseRetailOffer(script("83JC0080CL", "1.449.170", "https://schema.org/InStock").replace('"CLP"', '"USD"'), PRODUCT.sku),
    { priceClp: null, availability: "unknown" });
});
Deno.test("SP Digital transfer price is distinct from other payment prices", () => {
  const html = '<h1>Lenovo</h1><span>Part number: 83JC0080CL</span>' +
    '<div>Pago con transferencia <b>$1.449.170</b> Otros medios de pago $1.514.380</div><p>Stock online</p>';
  same(parseRetailOffer(html, PRODUCT.sku, "spdigital"), { priceClp: 1449170, availability: "unknown" });
});
Deno.test("Centrale and Winpy recognize explicit sold-out labels", () => {
  same(parseRetailOffer("<h1>LOQ</h1> MPN: 83JC0080CL ID: 39813 <b>Agotado</b>", PRODUCT.sku, "centrale"),
    { priceClp: null, availability: "out_of_stock" });
  same(parseRetailOffer('<b>Temporalmente Agotado</b><h2>Producto Agotado</h2><p>SKU: 83JC0080CL</p>', PRODUCT.sku, "winpy"),
    { priceClp: null, availability: "out_of_stock" });
});
Deno.test("a stock section heading alone is never treated as InStock", () => {
  equal(parseRetailOffer("Part number: 83JC0080CL Pago con transferencia $1.449.170 Stock online", PRODUCT.sku, "spdigital").availability, "unknown");
});
Deno.test("normalizes stock states without inferring unknowns", () => {
  equal(parseAvailability("https://schema.org/InStock"), "in_stock");
  equal(parseAvailability("https://schema.org/OutOfStock"), "out_of_stock");
  equal(parseAvailability("https://schema.org/PreOrder"), "preorder");
  equal(parseAvailability(undefined), "unknown");
});
Deno.test("three store URLs do not imply three verified prices", () => {
  same(summarizeVerification([
    { priceClp: null, availability: "out_of_stock" },
    { priceClp: 1449170, availability: "unknown" },
    { priceClp: null, availability: "unknown" },
  ]), { totalSources: 3, verifiedPrices: 1, verifiedStocks: 1, comparable: false, stockComplete: false });
});
Deno.test("HTTP blocking keeps price and stock unknown", async () => {
  const fakeFetch = async (url: string) => url.includes("winpy")
    ? new Response("", { status: 403 })
    : new Response(url.includes("centrale") ? "MPN: 83JC0080CL Agotado" :
      "Part number: 83JC0080CL Pago con transferencia $1.449.170",
      { headers: { "content-type": "text/html" } });
  const result = await fetchLiveProduct(fakeFetch as typeof fetch, new Date("2026-11-09T12:00:00Z"));
  same(result.offers.map((offer) => offer.priceClp), [null, 1449170, null]);
  same(result.offers.map((offer) => offer.availability), ["out_of_stock", "unknown", "unknown"]);
  same(result.offers.map((offer) => offer.queryStatus), ["verified", "verified", "blocked"]);
  equal(result.verification.comparable, false);
});
