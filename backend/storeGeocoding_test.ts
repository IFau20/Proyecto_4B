import {strictEqual as equal} from "node:assert/strict";
import {geocodeStoreLocations} from "./storeGeocoding.ts";
Deno.test("does not share user location with the geocoder",async()=>{
 let requested="";
 const fetcher=async(url:string)=>{requested=url;return Response.json([{lat:"-33.431",lon:"-70.622"}]);};
 const stores=[{address:"Avenida Manuel Montt 170, Providencia, Santiago, Chile",lat:null,lon:null}];
 const locations=await geocodeStoreLocations(stores,fetcher as typeof fetch);
 equal(locations[0].lat,-33.431);
 equal(requested.includes("nominatim.openstreetmap.org/search"),true);
 equal(requested.includes("countrycodes=cl"),true);
});
Deno.test("rejects coordinates outside Chile",async()=>{
 const fetcher=async()=>Response.json([{lat:"48.7",lon:"2.3"}]);
 const result=await geocodeStoreLocations([{address:"Invalid Store, Chile",lat:null,lon:null}],fetcher as typeof fetch);
 equal(result[0].lat,null);
});
