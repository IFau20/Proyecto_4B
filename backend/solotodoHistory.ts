import { readHistory, summarizePriceHistory } from "./history.ts";

// Public SoloTodo price-history API. Requests are on-demand with a six-hour cache;
// no private sessions, CAPTCHA bypass or bulk imports.
const API = "https://publicapi.solotodo.com";
const MAX_AGE_MS = 6 * 60 * 60 * 1000;
const memory = new Map<string, { at: number; result: ReturnType<typeof summarizePriceHistory> }>();

type Registry = {
  timestamp?: string;
  is_available?: boolean;
  offer_price?: string | number;
  normal_price?: string | number;
};
type Group = {
  entity?: { store_id?: number; currency_id?: number; name?: string };
  pricing_history?: Registry[];
};

function normalizeSku(sku: string) {
  return sku.split("#")[0].replace(/[^A-Za-z0-9]/g, "").toUpperCase();
}

export function getPublicProductId(profileUrl: string | null | undefined): number | null {
  const match = /^https:\/\/www\.solotodo\.cl\/products\/(\d+)(?:-|\/|$)/.exec(profileUrl ?? "");
  if (!match) return null;
  const id = Number(match[1]);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function priceInClp(value: unknown): number | null {
  const price = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  return Number.isSafeInteger(price) && price >= 100000 && price <= 15000000 ? price : null;
}

export function parsePublicPriceHistory(
  sku: string, groups: unknown, names: Map<number, string> = new Map(),
) {
  if (!Array.isArray(groups)) return null;
  const points: Array<{sku:string; sourceId:string; priceClp:number; checkedAt:string}> = [];
  for (const group of groups as Group[]) {
    const storeId=group?.entity?.store_id;
    if (!Number.isInteger(storeId) || !Array.isArray(group.pricing_history)) continue;
    // SoloTodo's CLP currency is ID 1. Do not treat other currencies as pesos.
    if (group.entity?.currency_id != null && group.entity.currency_id !== 1) continue;
    for (const observation of group.pricing_history) {
      if (observation?.is_available !== true || typeof observation.timestamp !== "string") continue;
      const priceClp=priceInClp(observation.offer_price);
      if (priceClp === null || !Number.isFinite(Date.parse(observation.timestamp))) continue;
      points.push({
        sku, sourceId:"store-"+storeId, priceClp,
        checkedAt:new Date(observation.timestamp).toISOString(),
      });
    }
  }
  if (!points.length) return null;
  const original = summarizePriceHistory({version:1,points},sku);
  return {...original, source:"solotodo_public", sources:original.sources.map(series=>({
    ...series, sourceName:names.get(Number(series.sourceId.slice(6))) || "Tienda "+series.sourceId.slice(6),
  }))};
}

async function getJson(url: string, fetcher: typeof fetch) {
  const response = await fetcher(url,{
    signal:AbortSignal.timeout(6500),
    headers:{"Accept":"application/json","User-Agent":"PCTracker-academic-project/1.0"},
  });
  if (!response.ok) throw Error("SoloTodo API returned "+response.status);
  return await response.json();
}

async function publicHistory(profileUrl:string, sku:string, fetcher:typeof fetch) {
  const id=getPublicProductId(profileUrl);
  if (id === null) return null;
  const product=await getJson(API+"/products/"+id+"/",fetcher);
  const identifier=normalizeSku(String(product?.part_number || ""));
  if (!identifier || identifier !== normalizeSku(sku)) return null;
  const after=new Date(Date.now()-365*86400000).toISOString();
  const groups=await getJson(API+"/products/"+id+"/pricing_history/?timestamp_after="+encodeURIComponent(after),fetcher);
  let names=new Map<number,string>();
  try {
    const raw=await getJson(API+"/stores/",fetcher);
    const stores=Array.isArray(raw)?raw:Array.isArray(raw?.results)?raw.results:[];
    names=new Map(stores.filter((s:any)=>Number.isInteger(s?.id)&&typeof s?.name==="string")
      .map((s:any)=>[s.id,s.name]));
  } catch { /* History can still be plotted with source IDs. */ }
  return parsePublicPriceHistory(sku,groups,names);
}

export async function historyWithFallback(
  sku:string, profileUrl:string|null|undefined, fetcher:typeof fetch=fetch,
) {
  if (getPublicProductId(profileUrl) !== null) {
    const previous=memory.get(sku);
    if (previous && Date.now()-previous.at<MAX_AGE_MS) return previous.result;
    try {
      const result=await publicHistory(profileUrl!,sku,fetcher);
      if (result && result.observations) {
        memory.set(sku,{at:Date.now(),result});
        return result;
      }
    } catch (error) {
      console.warn("Public historical source unavailable; using local observations:", error);
    }
  }
  const local=summarizePriceHistory(await readHistory(),sku);
  return {...local,source:"pc_tracker_local",sources:local.sources.map(s=>({...s,sourceName:s.sourceId}))};
}
