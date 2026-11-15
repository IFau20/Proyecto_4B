import { getNotebooks } from "../notebooks.ts";
const notebooks=await getNotebooks();
const offers=notebooks.flatMap(n=>n.offers.map(offer=>({...offer,sku:n.sku,name:n.name})));
const discounts=offers.filter(o=>Number.isInteger(o.priceClp)&&Number.isInteger(o.listPriceClp)&&
  o.listPriceClp>o.priceClp&&(o.listPriceClp-o.priceClp)/o.listPriceClp>=0.20);
const result={
  modelCount:notebooks.length,modelsWithPhotos:notebooks.filter(n=>!!n.imageUrl).length,
  storePagesConfigured:offers.length,pricesVerified:offers.filter(o=>o.priceClp!==null).length,
  stockStatesVerified:offers.filter(o=>o.availability!=="unknown").length,
  promotionsAtOrAbove20Percent:discounts.map(o=>({
    sku:o.sku,source:o.sourceName,priceClp:o.priceClp,normalPriceClp:o.listPriceClp
  })),
  details:notebooks.map(n=>({
    sku:n.sku,name:n.name,image:!!n.imageUrl,verifiedPrices:n.verification?.verifiedPrices,
    offers:n.offers.map(o=>({store:o.sourceName,price:o.priceClp,stock:o.availability,status:o.queryStatus}))
  }))
};
console.log(JSON.stringify(result,null,2));
if(notebooks.length<10)Deno.exit(1);
// A retailer blocking requests must not cause the build to fail.
