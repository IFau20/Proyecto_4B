import { getNotebooks } from "../notebooks.ts";
const startedAt=performance.now();
const notebooks=await getNotebooks();
const catalogBuildMs=Math.round(performance.now()-startedAt);
const offers=notebooks.flatMap(n=>n.offers.map(offer=>({...offer,sku:n.sku,name:n.name})));
const discounts=offers.filter(o=>Number.isInteger(o.priceClp)&&Number.isInteger(o.listPriceClp)&&
  o.listPriceClp>o.priceClp&&(o.listPriceClp-o.priceClp)/o.listPriceClp>=0.20);
const references=offers.filter(o=>Number.isSafeInteger(o.referencePriceClp)&&o.referencePriceClp>0);
const recentReferenceDeals=references.filter(o=>{
  const normal=o.referenceNormalPriceClp;
  const age=Date.now()-Date.parse((o.referenceObservedOn||"1900-01-01")+"T00:00:00Z");
  return Number.isSafeInteger(normal)&&normal>o.referencePriceClp &&
    (normal-o.referencePriceClp)/normal>=0.20 &&
    age>=0 && age<=7*86400000 && o.availability!=="out_of_stock";
});
const result={
  modelCount:notebooks.length,catalogBuildMs,retailerNames:[...new Set(offers.map(o=>o.sourceName))].sort(),
  distinctRetailers:new Set(offers.map(o=>o.sourceName)).size,
  modelsWithPhotos:notebooks.filter(n=>!!n.imageUrl).length,
  storePagesConfigured:offers.length,pricesVerified:offers.filter(o=>o.priceClp!==null).length,
  stockStatesVerified:offers.filter(o=>o.availability!=="unknown").length,
  publishedReferences:references.length,
  notebooksWithStorePrices:notebooks.filter(n=>n.offers.some(o=>
    Number.isSafeInteger(o.priceClp)||Number.isSafeInteger(o.referencePriceClp))).length,
  notebooksWithHistoricalOnly:notebooks.filter(n=>Number.isSafeInteger(n.historicalPriceClp)&&
    !n.offers.some(o=>Number.isSafeInteger(o.priceClp)||Number.isSafeInteger(o.referencePriceClp))).length,
  notebooksWithoutAnyPrice:notebooks.filter(n=>!Number.isSafeInteger(n.historicalPriceClp)&&
    !n.offers.some(o=>Number.isSafeInteger(o.priceClp)||Number.isSafeInteger(o.referencePriceClp))).length,
  recentPublishedDiscountsAtOrAbove20Percent:recentReferenceDeals.map(o=>({
    sku:o.sku,source:o.sourceName,priceClp:o.referencePriceClp,
    normalPriceClp:o.referenceNormalPriceClp,publishedOn:o.referenceObservedOn,
    status:"published_reference_not_live_verified"
  })),
  promotionsAtOrAbove20Percent:discounts.map(o=>({
    sku:o.sku,source:o.sourceName,priceClp:o.priceClp,normalPriceClp:o.listPriceClp
  })),
  details:notebooks.map(n=>({
    sku:n.sku,name:n.name,image:!!n.imageUrl,verifiedPrices:n.verification?.verifiedPrices,
    historicalPrice:n.historicalPriceClp,historicalDate:n.historicalObservedAt,
    offers:n.offers.map(o=>({store:o.sourceName,price:o.priceClp,referencePrice:o.referencePriceClp??null,stock:o.availability,status:o.queryStatus}))
  }))
};
console.log(JSON.stringify(result,null,2));
if(notebooks.length<10)Deno.exit(1);
// A retailer blocking requests must not cause the build to fail.
