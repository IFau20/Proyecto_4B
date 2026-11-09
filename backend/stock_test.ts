import { strictEqual as equal, deepStrictEqual as same } from "node:assert/strict";
import { parseRetailOffer, parseAvailability } from "./liveSources.ts";
Deno.test("recognizes structured availability states", () => {
 equal(parseAvailability("https://schema.org/InStock"), "in_stock");
 equal(parseAvailability("https://schema.org/OutOfStock"), "out_of_stock");
 equal(parseAvailability("https://schema.org/PreOrder"), "preorder");
 equal(parseAvailability(undefined), "unknown");
});
Deno.test("matches stock and price only to the exact manufacturer SKU", () => {
 const make = (sku: string) => '<html>83JC0080CL<script type="application/ld+json">' +
 JSON.stringify({ "@type":"Product", sku, offers: { price:1287180, priceCurrency:"CLP", availability:"https://schema.org/InStock" } }) + '</script></html>';
 same(parseRetailOffer(make("83JC0080CL"), "83JC0080CL"), { priceClp:1287180, availability:"in_stock" });
 same(parseRetailOffer(make("WRONG"), "83JC0080CL"), { priceClp:null, availability:"unknown" });
});
