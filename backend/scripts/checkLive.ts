import { fetchLiveProduct } from "../liveSources.ts";
const product = await fetchLiveProduct();
console.log(JSON.stringify({
  sku: product.sku,
  ...product.verification,
  offers: product.offers.map(({ sourceName, priceClp, availability, queryStatus, checkedAt, url }) =>
    ({ sourceName, priceClp, availability, queryStatus, checkedAt, url })),
}, null, 2));
if (!product.verification.comparable || !product.verification.stockComplete) {
  console.error("INCOMPLETE: Three prices and three stock states could not all be verified.");
  Deno.exit(1);
}
