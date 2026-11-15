import { expect, it } from "vitest";
import { kilometersBetween,nearestSixStores } from "./FeaturesPanel.jsx";
it("returns zero distance for the same location", () => {
  expect(kilometersBetween({lat:-33.43,lon:-70.61},{lat:-33.43,lon:-70.61})).toBe(0);
});
it("computes positive distances for two distinct stores", () => {
  const km=kilometersBetween({lat:-33.42419,lon:-70.61829},{lat:-33.4478,lon:-70.611});
  expect(km).toBeGreaterThan(2);
  expect(km).toBeLessThan(4);
});

it("returns exactly the nearest six geolocated stores and excludes unlocated entries",()=>{
 const stores=Array.from({length:10},(_,i)=>({
  sourceId:"shop"+i,name:"Shop "+i,address:"Store "+i+", Santiago, Chile",
  lat:-33.4-i*.001,lon:-70.6
 }));
 stores.push({sourceId:"unlocated",name:"Unknown",address:"Unlocated, Chile",lat:null,lon:null});
 const nearby=nearestSixStores(stores,{lat:-33.4,lon:-70.6});
 expect(nearby).toHaveLength(6);
 expect(nearby.map(s=>s.sourceId)).toEqual(["shop0","shop1","shop2","shop3","shop4","shop5"]);
});
