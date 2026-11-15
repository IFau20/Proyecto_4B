import {historyWithFallback} from "../solotodoHistory.ts";
const sku="NP750XGJ-KS5CL";
const profile="https://www.solotodo.cl/products/255552-samsung-galaxy-book4-silver-np750xgj-ks5cl";
const result=await historyWithFallback(sku,profile);
console.log(JSON.stringify({source:result.source,observations:result.observations,stores:result.sources.map(s=>s.sourceName)},null,2));
