// Fixed allowlist: all URLs are for the same Lenovo manufacturer SKU.
export const PRODUCT = {
  id: "lenovo-loq-83jc0080cl", name: "Lenovo LOQ 15ARP9 (83JC0080CL)",
  sku: "83JC0080CL", ramGb: 24, gpu: "NVIDIA GeForce RTX 4050",
  processor: "AMD Ryzen 7 7435HS", isLive: true,
  sources: [
    { sourceId: "centrale", sourceName: "Centrale", url: "https://centrale.cl/producto/notebook-lenovo-loq-15-6-ryzen-7-7435hs-24gb-1tb-ssd-rtx-4050-w11h/" },
    { sourceId: "spdigital", sourceName: "SP Digital", url: "https://www.spdigital.cl/lv-loq-gen-9-r7-7435hs-241tb-156-fhd-144hz-rtx-4050-6gb-luna-grey/" },
    { sourceId: "winpy", sourceName: "Winpy", url: "https://www.winpy.cl/venta/notebook-gamer-lenovo-loq-de-15-6-ryzen-7-7435hs-rtx-4050-24gb-ram-1tb-ssd-win11/" },
  ],
};

function parseClp(value) {
  if (typeof value === "number") return Number.isInteger(value) && value >= 100000 && value <= 15000000 ? value : null;
  if (typeof value !== "string") return null;
  const s = value.trim().replace(/^CLP\s*/i, "");
  const normalized = /^\d{1,3}(?:\.\d{3})+$/.test(s) ? s.replace(/\./g, "") :
    /^\d{6,8}$/.test(s) ? s : null;
  return normalized ? parseClp(Number(normalized)) : null;
}

function findProducts(value, depth = 0) {
  if (!value || typeof value !== "object" || depth > 10) return [];
  if (Array.isArray(value)) return value.flatMap((item) => findProducts(item, depth + 1));
  const types = Array.isArray(value["@type"]) ? value["@type"] : [value["@type"]];
  const matches = types.includes("Product") ? [value] : [];
  for (const [key, child] of Object.entries(value)) {
    if (key !== "offers" && child && typeof child === "object") matches.push(...findProducts(child, depth + 1));
  }
  return matches;
}

// Prefer schema.org Product / Offer to avoid selecting crossed-out or installment prices.
export function parseRetailOffer(html, sku) {
  if (typeof html !== "string" || !html.toUpperCase().includes(sku.toUpperCase())) return { priceClp: null, availability: "unknown" };
  const scripts = html.matchAll(/<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  for (const [, script] of scripts) {
    let parsed;
    try { parsed = JSON.parse(script); } catch { continue; }
    for (const product of findProducts(parsed)) {
      const productSku = String(product.sku ?? product.mpn ?? "").toUpperCase();
      if (productSku !== sku.toUpperCase()) continue;
      const offers = Array.isArray(product.offers) ? product.offers : [product.offers];
      for (const offer of offers) {
        if (!offer || typeof offer !== "object") continue;
        if (offer.priceCurrency && String(offer.priceCurrency).toUpperCase() !== "CLP") continue;
        const price = parseClp(offer.price ?? offer.lowPrice ?? offer.priceSpecification?.price);
        const availability = parseAvailability(offer.availability);
        if (price !== null || availability !== "unknown") return { priceClp: price, availability };
      }
    }
  }
  return { priceClp: null, availability: "unknown" };
}
export function parseAvailability(value) {
  const status = typeof value === "string" ? value.split("/").pop()?.toLowerCase() : null;
  if (status === "instock" || status === "limitedavailability") return "in_stock";
  if (status === "outofstock" || status === "soldout" || status === "discontinued") return "out_of_stock";
  if (status === "preorder" || status === "presale" || status === "backorder") return "preorder";
  return "unknown";
}
export function parseRetailPrice(html, sku) { return parseRetailOffer(html, sku).priceClp; }

const TIMEOUT_MS = 6000;
const CACHE_MS = 10 * 60 * 1000;
let cached = null;
let cachedAt = -Infinity;
let pending = null;

export async function fetchLiveProduct(fetcher = fetch, now = new Date()) {
  const checkedAt = now.toISOString();
  const offers = await Promise.all(PRODUCT.sources.map(async (source) => {
    let priceClp = null;
    let availability = "unknown";
    try {
      const response = await fetcher(source.url, {
        signal: AbortSignal.timeout(TIMEOUT_MS),
        headers: { Accept: "text/html" },
      });
      if (!response.ok) throw Error("Store unavailable");
      const details = parseRetailOffer(await response.text(), PRODUCT.sku);
      priceClp = details.priceClp;
      availability = details.availability;
    } catch {
      // Network errors, bot protection and parsing failures must never invent prices.
    }
    return { ...source, priceClp, availability, checkedAt };
  }));
  const { sources: _sources, ...computer } = PRODUCT;
  return { ...computer, offers };
}

export async function getLiveProduct(fetcher = fetch, now = Date.now()) {
  if (cached && now - cachedAt < CACHE_MS) return cached;
  if (pending) return pending;
  pending = fetchLiveProduct(fetcher, new Date(now));
  try {
    cached = await pending;
    cachedAt = now;
    return cached;
  } finally { pending = null; }
}
