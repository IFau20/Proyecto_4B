// Durable snapshots of prices actually observed by the Deno retailer collector.
export type PricePoint = { sku: string; sourceId: string; priceClp: number; checkedAt: string };
export type PriceHistory = { version: 1; points: PricePoint[] };
const DEFAULT_PATH = new URL("./data/price-history.json", import.meta.url);
const SIX_HOURS = 6 * 60 * 60 * 1000;
let writeQueue: Promise<void> = Promise.resolve();

export function mergePricePoints(existing: PriceHistory, entries: PricePoint[]): PriceHistory {
  const merged = [...existing.points];
  for (const point of entries) {
    if (!point || !/^[A-Za-z0-9_.#-]{1,100}$/.test(point.sku) || !/^[A-Za-z0-9_.#-]{1,100}$/.test(point.sourceId) ||
        !Number.isSafeInteger(point.priceClp) || point.priceClp <= 0 ||
        !Number.isFinite(Date.parse(point.checkedAt))) continue;
    const last = [...merged].reverse().find((previous) =>
      previous.sku === point.sku && previous.sourceId === point.sourceId);
    if (last && Math.abs(Date.parse(point.checkedAt) - Date.parse(last.checkedAt)) < SIX_HOURS) continue;
    merged.push({ sku: point.sku, sourceId: point.sourceId, priceClp: point.priceClp, checkedAt: point.checkedAt });
  }
  return { version: 1, points: merged.slice(-10000) };
}

export function summarizePriceHistory(history: PriceHistory, sku: string) {
  const points = history.points.filter((entry) => entry.sku === sku)
    .sort((a, b) => a.checkedAt.localeCompare(b.checkedAt));
  const bySource: Record<string, PricePoint[]> = {};
  for (const point of points) (bySource[point.sourceId] ??= []).push(point);
  const sourceSummaries = Object.entries(bySource).map(([sourceId, series]) => ({
    sourceId,
    points: series,
    firstPrice: series[0].priceClp,
    latestPrice: series.at(-1)!.priceClp,
    minPrice: Math.min(...series.map((p) => p.priceClp)),
    maxPrice: Math.max(...series.map((p) => p.priceClp)),
    changeClp: series.at(-1)!.priceClp - series[0].priceClp,
  }));
  return { sku, points, sources: sourceSummaries, observations: points.length };
}

export async function readHistory(path: string | URL = DEFAULT_PATH): Promise<PriceHistory> {
  try {
    const parsed = JSON.parse(await Deno.readTextFile(path));
    if (parsed?.version !== 1 || !Array.isArray(parsed.points)) throw Error("Invalid history");
    return { version: 1, points: parsed.points.filter((p: PricePoint) => p &&
      typeof p.sku === "string" && typeof p.sourceId === "string" &&
      Number.isSafeInteger(p.priceClp) && p.priceClp > 0 &&
      typeof p.checkedAt === "string" && Number.isFinite(Date.parse(p.checkedAt))) };
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) return { version: 1, points: [] };
    throw error;
  }
}

export async function saveObservations(
  sku: string,
  offers: Array<{ sourceId: string; priceClp: number | null; checkedAt: string; availability: string }>,
  path: string | URL = DEFAULT_PATH,
): Promise<void> {
  const points = offers.filter((offer) =>
    Number.isSafeInteger(offer.priceClp) && offer.priceClp! > 0 && offer.availability !== "out_of_stock")
    .map((offer) => ({ sku, sourceId: offer.sourceId, priceClp: offer.priceClp!, checkedAt: offer.checkedAt }));
  if (points.length === 0) return;
  const work = writeQueue.catch(() => {}).then(async () => {
    const next = mergePricePoints(await readHistory(path), points);
    const fullPath = path instanceof URL ? path : new URL("file://" + path);
    const temporary = new URL(fullPath.href + ".tmp");
    await Deno.writeTextFile(temporary, JSON.stringify(next, null, 2) + "\n");
    await Deno.rename(temporary, fullPath);
  });
  writeQueue = work;
  await work;
}
