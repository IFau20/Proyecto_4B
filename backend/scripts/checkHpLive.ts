import { fetchHpProduct } from "../hpSources.ts";
const data = await fetchHpProduct();
console.log(JSON.stringify({
  sku: data.sku,
  ...data.verification,
  offers: data.offers.map(({sourceName,priceClp,availability,queryStatus,checkedAt,url}) =>
    ({sourceName,priceClp,availability,queryStatus,checkedAt,url})),
}, null, 2));
if (!data.verification.comparable || !data.verification.stockComplete) {
  console.error("INCOMPLETE: three prices or all four stock states are not verified.");
  Deno.exit(1);
}
