import {getFreshNotebooks} from "../notebooks.ts";
import {getStores} from "../stores.ts";
import {holidayOn} from "../holidays.ts";
import {branchStockForSku} from "../branchStock.ts";
import {readHistory} from "../history.ts";

const start=performance.now();
const [products,stores,holiday]=await Promise.all([
 getFreshNotebooks(),getStores(),holidayOn("2026-12-25").catch(()=>null)
]);
const branch=await branchStockForSku("83JE0184CL");
const offers=products.flatMap(p=>p.offers.map(o=>({...o,sku:p.sku})));
const unique=(arr:any[])=>new Set(arr.map(o=>String(o.sourceName||"").toLowerCase().trim())).size;
const withPrices=(p:any)=>p.offers.filter((o:any)=>
 Number.isSafeInteger(o.priceClp)||Number.isSafeInteger(o.referencePriceClp));
const threePublished=products.filter(p=>unique(withPrices(p))>=3);
const threeVerified=products.filter(p=>unique(p.offers.filter(o=>Number.isSafeInteger(o.priceClp)))>=3);
const local=await readHistory().catch(()=>({version:1 as const,points:[]}));
console.log(JSON.stringify({
 checkedAt:new Date().toISOString(),
 durationMs:Math.round(performance.now()-start),
 catalogModels:products.length,
 publishedRetailerNames:unique(offers),
 threePublishedPriceSourcesModels:threePublished.length,
 sampleThreeSourceSkus:threePublished.slice(0,6).map(p=>p.sku),
 threeDirectlyVerifiedPriceSourcesModels:threeVerified.length,
 directPriceCount:offers.filter(o=>Number.isSafeInteger(o.priceClp)).length,
 publishedPriceCount:offers.filter(o=>Number.isSafeInteger(o.referencePriceClp)).length,
 directOnlineStockStates:offers.filter(o=>o.availability!=="unknown").length,
 publicReportedOnlineAvailability:offers.filter(o=>o.reportedAvailability==="in_stock").length,
 verifiedRegularStoreHours:stores.filter(s=>s.scheduleVerified).length,
 holidayCalendar:holiday?.name||"unavailable",
 physicalStoreCount:stores.length,
 storesWithCoordinates:stores.filter(s=>Number.isFinite(s.lat)&&Number.isFinite(s.lon)).length,
 verifiedBranchInventoryForSampleSku:branch.length,
 availableBranchInventoryForSampleSku:branch.filter(x=>x.status==="in_stock").length,
 locallyRecordedHistoryModels:new Set(local.points.map(p=>p.sku)).size
},null,2));
