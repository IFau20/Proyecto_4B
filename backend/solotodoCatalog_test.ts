import {strictEqual as equal} from "node:assert/strict";
import {addPublishedOffers} from "./solotodoCatalog.ts";
import type {CatalogLaptop} from "./solotodoCatalog.ts";
Deno.test("matches exact manufacturer identifiers before using a public price",()=>{
 const p:CatalogLaptop[]=[{sku:"NP750XGJ-KS5CL",profileUrl:"https://www.solotodo.cl/products/255552-galaxy-book4",imageUrl:null,offers:[]}];
 const rows={results:[{product:{id:255552,part_number:"NP750XGJ-KS5CL",picture_url:"https://cdn.shopify.com/a.jpg"},
 entities:[{id:55,store_id:20,currency_id:1,is_visible:true,external_url:"https://example.org/item",
 active_registry:{is_available:true,offer_price:"629990",timestamp:"2026-11-15T10:00:00Z"}}]}]};
 equal(addPublishedOffers(p,rows,[{id:20,name:"Paris"}]),1);
 equal(p[0].offers[0].referencePriceClp,629990);
 equal(p[0].offers[0].priceClp,null);
 equal(p[0].offers[0].sourceName,"Paris");
 equal(p[0].imageUrl,"https://cdn.shopify.com/a.jpg");
});
Deno.test("rejects wrong SKU, used, unavailable and non-CLP listings",()=>{
 const p:CatalogLaptop[]=[{sku:"BA1U9LA",profileUrl:"https://www.solotodo.cl/products/355283-victus",imageUrl:null,offers:[]}];
 const entities=[{id:1,store_id:2,currency_id:1,is_visible:true,
    external_url:"https://www.example.com/",active_registry:{is_available:true,offer_price:"800000"},condition:"used"},
   {id:2,store_id:3,currency_id:2,is_visible:true,
    external_url:"https://www.example.com/",active_registry:{is_available:true,offer_price:"800000"},condition:"new"},
   {id:3,store_id:4,currency_id:1,is_visible:true,
    external_url:"https://www.example.com/",active_registry:{is_available:false,offer_price:"800000"},condition:"new"}];
 equal(addPublishedOffers(p,{results:[{product:{id:355283,part_number:"OTHER"},entities}]},[]),0);
 equal(addPublishedOffers(p,{results:[{product:{id:355283,part_number:"BA1U9LA"},entities}]},[]),0);
 equal(p[0].offers.length,0);
});

Deno.test("public price lookup requests multiple exact SKU batches without exceeding two in flight",async()=>{
 const products=Array.from({length:25},(_,i)=>({
   sku:"SKU-"+i,profileUrl:"https://www.solotodo.cl/products/"+(90000+i)+"-demo",
   imageUrl:null,offers:[],
 }));
 let active=0,maximum=0,batches=0;
 const fetcher=async(url:string)=>{
   if(url.endsWith("/stores/"))return Response.json([]);
   active++;maximum=Math.max(maximum,active);batches++;
   await new Promise(resolve=>setTimeout(resolve,2));
   active--;
   return Response.json({results:[]});
 };
 const found=await enrichPublishedNotebookOffers(products,fetcher as typeof fetch);
 equal(found,0);
 equal(batches,3);
 equal(maximum<=2,true);
});
