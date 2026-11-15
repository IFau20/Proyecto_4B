import {getFreshNotebooks,verifyNotebookOffers} from "../notebooks.ts";
const products=await getFreshNotebooks();
const product=products.find(p=>p.sku==="D0CJ4LA")!;
const result=await verifyNotebookOffers(product);
console.log(JSON.stringify({checkedAt:result.checkedAt,sku:result.sku,...result.verification,
 offers:result.offers.map((o:any)=>({source:o.sourceName,url:o.url,priceClp:o.priceClp,
 availability:o.availability,queryStatus:o.queryStatus,checkedAt:o.checkedAt}))},null,2));
if(!result.verification.comparable)Deno.exit(1);
