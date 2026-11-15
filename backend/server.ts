import { handleRequest } from "./handler.ts";
import { getLiveProduct } from "./liveSources.ts";
import { getHpProduct } from "./hpSources.ts";
import { saveObservations } from "./history.ts";

const port = Number(Deno.env.get("PORT") ?? 8000);
const SIX_HOURS_MS = 6 * 60 * 60 * 1000;

async function collectVerifiedPrices() {
  for (const fetchProduct of [getLiveProduct, getHpProduct]) {
    try {
      const product = await fetchProduct();
      await saveObservations(product.sku, product.offers);
      console.log("Recorded observed prices for", product.sku, product.verification.verifiedPrices);
    } catch (error) {
      console.error("Price collection failed; other products remain available", error);
    }
  }
}

// Check now and every six hours while the Deno server is running.
// No historical values are simulated and no store access restrictions are bypassed.
void collectVerifiedPrices();
setInterval(() => { void collectVerifiedPrices(); }, SIX_HOURS_MS);

console.log("PC Tracker API running at http://localhost:" + port);
Deno.serve({ port }, handleRequest);
