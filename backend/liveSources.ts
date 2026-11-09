// PC Tracker: only fixed, verified product URLs can be queried.
export const PRODUCT = {
  id: "lenovo-loq-83jc0080cl",
  name: "Lenovo LOQ 15ARP9 (83JC0080CL)",
  sku: "83JC0080CL",
  ramGb: 24,
  gpu: "NVIDIA GeForce RTX 4050",
  processor: "AMD Ryzen 7 7435HS",
  isLive: true,
  sources: [
    { sourceId: "centrale", sourceName: "Centrale", url: "https://centrale.cl/producto/notebook-lenovo-loq-15-6-ryzen-7-7435hs-24gb-1tb-ssd-rtx-4050-w11h/" },
    { sourceId: "spdigital", sourceName: "SP Digital", url: "https://www.spdigital.cl/lv-loq-gen-9-r7-7435hs-241tb-156-fhd-144hz-rtx-4050-6gb-luna-grey/" },
    { sourceId: "winpy", sourceName: "Winpy", url: "https://www.winpy.cl/venta/notebook-gamer-lenovo-loq-de-15-6-ryzen-7-7435hs-rtx-4050-24gb-ram-1tb-ssd-win11/" },
  ],
};

function parseClp(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isSafeInteger(value) && value >= 100000 && value <= 15000000 ? value : null;
  }
  if (typeof value !== "string") return null;
  const str = value.trim().replace(/^(?:CLP|CL\$|\$)\s*/i, "");
  const digits = /^\d{1,3}(?:\.\d{3})+(?:,00)?$/.test(str)
    ? str.replace(/\./g, "").replace(/,00$/, "")
    : /^\d{6,8}(?:[.,]00)?$/.test(str) ? str.replace(/[.,]00$/, "") : null;
  return digits === null ? null : parseClp(Number(digits));
}

export function parseAvailability(value: unknown): string {
  const state = typeof value === "string" ? value.split(/[/#]/).pop()?.toLowerCase() : null;
  if (state === "instock" || state === "limitedavailability") return "in_stock";
  if (state === "outofstock" || state === "soldout" || state === "discontinued") return "out_of_stock";
  if (state === "preorder" || state === "presale" || state === "backorder") return "preorder";
  return "unknown";
}

function walkProducts(value: any, depth = 0): any[] {
  if (!value || typeof value !== "object" || depth > 10) return [];
  if (Array.isArray(value)) return value.flatMap((entry) => walkProducts(entry, depth + 1));
  const types = Array.isArray(value["@type"]) ? value["@type"] : [value["@type"]];
  const products = types.some((type: unknown) => typeof type === "string" && type.toLowerCase() === "product") ? [value] : [];
  for (const [key, child] of Object.entries(value)) {
    if (key !== "offers" && child && typeof child === "object") {
      products.push(...walkProducts(child, depth + 1));
    }
  }
  return products;
}

function structuredOffer(html: string, sku: string) {
  let priceClp: number | null = null;
  let availability = "unknown";
  for (const [, attrs, source] of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)) {
    if (!/\btype\s*=\s*["']application\/ld\+json["']/i.test(attrs)) continue;
    let json;
    try { json = JSON.parse(source); } catch { continue; }
    for (const product of walkProducts(json)) {
      const identifier = String(product.sku ?? product.mpn ?? product.productID ?? "").trim();
      if (identifier.toUpperCase() !== sku.toUpperCase()) continue;
      const offers = Array.isArray(product.offers) ? product.offers : [product.offers];
      for (const offer of offers) {
        if (!offer || typeof offer !== "object") continue;
        if (String(offer.priceCurrency ?? "").toUpperCase() !== "CLP") continue;
        priceClp ??= parseClp(offer.price ?? offer.lowPrice ?? offer.priceSpecification?.price);
        if (availability === "unknown") availability = parseAvailability(offer.availability);
      }
    }
  }
  return { priceClp, availability };
}

function visibleText(html: string): string {
  return html
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<(script|style|noscript|template)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&(?:nbsp|#160);/gi, " ")
    .replace(/&(?:dollar|#36);/gi, "$")
    .replace(/\s+/g, " ")
    .trim();
}

function visibleOffer(html: string, sku: string, sourceId: string) {
  let priceClp: number | null = null;
  let availability = "unknown";
  if (!["centrale", "spdigital", "winpy"].includes(sourceId)) return { priceClp, availability };
  const text = visibleText(html);
  const label = sourceId === "centrale" ? "MPN" : sourceId === "spdigital" ? "Part number" : "SKU";
  // sku comes exclusively from a fixed, alphanumeric manufacturer code, not user input.
  const marker = new RegExp("\\b" + label + "\\s*:\\s*" + sku + "\\b", "i").exec(text);
  if (!marker) return { priceClp, availability };
  const after = text.slice(marker.index + marker[0].length, marker.index + marker[0].length + 2200);
  const before = text.slice(Math.max(0, marker.index - 1800), marker.index);
  if (sourceId === "spdigital") {
    const match = /\bPago con transferencia\b.{0,300}?\$\s*([\d.,]+)/i.exec(after);
    priceClp = match ? parseClp(match[1]) : null;
    // "Stock online" is a section label, not proof of available inventory.
  } else if (sourceId === "centrale") {
    if (/\bAgotado\b/i.test(after.slice(0, 1500))) availability = "out_of_stock";
  } else if (sourceId === "winpy") {
    if (/\b(?:Temporalmente Agotado|Producto Agotado)\b/i.test(before)) {
      availability = "out_of_stock";
    }
  }
  return { priceClp, availability };
}

export function parseRetailOffer(html: string, sku: string, sourceId = "") {
  if (!html.toUpperCase().includes(sku.toUpperCase())) {
    return { priceClp: null, availability: "unknown" };
  }
  const primary = structuredOffer(html, sku);
  const fallback = visibleOffer(html, sku, sourceId);
  return {
    priceClp: primary.priceClp ?? fallback.priceClp,
    availability: primary.availability !== "unknown" ? primary.availability : fallback.availability,
  };
}

export function parseRetailPrice(html: string, sku: string) {
  return parseRetailOffer(html, sku).priceClp;
}

export function summarizeVerification(offers: Array<{ priceClp: number | null; availability: string }>) {
  const totalSources = offers.length;
  const verifiedPrices = offers.filter((offer) => offer.priceClp !== null).length;
  const verifiedStocks = offers.filter((offer) => offer.availability !== "unknown").length;
  return {
    totalSources, verifiedPrices, verifiedStocks,
    comparable: verifiedPrices >= 3,
    stockComplete: verifiedStocks === totalSources,
  };
}

const TIMEOUT_MS = 8000;
const CACHE_MS = 10 * 60 * 1000;
let cache: Awaited<ReturnType<typeof fetchLiveProduct>> | null = null;
let cachedAt = -Infinity;
let pending: Promise<Awaited<ReturnType<typeof fetchLiveProduct>>> | null = null;

export async function fetchLiveProduct(fetcher: typeof fetch = fetch, now = new Date()) {
  const checkedAt = now.toISOString();
  const offers = await Promise.all(PRODUCT.sources.map(async (source) => {
    let priceClp: number | null = null;
    let availability = "unknown";
    let queryStatus = "unverified";
    try {
      const response = await fetcher(source.url, {
        signal: AbortSignal.timeout(TIMEOUT_MS),
        headers: { Accept: "text/html" },
      });
      if (!response.ok) {
        queryStatus = response.status === 403 || response.status === 429 ? "blocked" : "http_error";
      } else {
        const contentType = response.headers.get("content-type") ?? "text/html";
        if (!/text\/html|application\/xhtml\+xml/i.test(contentType)) {
          queryStatus = "unsupported";
        } else {
          const parsed = parseRetailOffer(await response.text(), PRODUCT.sku, source.sourceId);
          priceClp = parsed.priceClp;
          availability = parsed.availability;
          queryStatus = priceClp !== null || availability !== "unknown" ? "verified" : "unverified";
        }
      }
    } catch {
      queryStatus = "network_error";
    }
    return { ...source, priceClp, availability, queryStatus, checkedAt };
  }));
  const { sources: _sources, ...computer } = PRODUCT;
  return { ...computer, offers, verification: summarizeVerification(offers) };
}

export async function getLiveProduct(fetcher: typeof fetch = fetch, now = Date.now()) {
  if (cache && now - cachedAt < CACHE_MS) return cache;
  if (pending) return pending;
  pending = fetchLiveProduct(fetcher, new Date(now));
  try {
    cache = await pending;
    cachedAt = now;
    return cache;
  } finally {
    pending = null;
  }
}
