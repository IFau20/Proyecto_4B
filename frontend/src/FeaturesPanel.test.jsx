import { expect, it } from "vitest";
import { kilometersBetween,nearestSixStores,branchStatus,hoursOnDate } from "./FeaturesPanel.jsx";
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

it("never infers branch availability from online store stock",()=>{
 expect(branchStatus({sourceId:"pcfactory-montt"},[])).toBe("unknown");
 expect(branchStatus({sourceId:"pcfactory-montt"},[{sourceId:"pcfactory-montt",status:"in_stock"}])).toBe("in_stock");
 expect(branchStatus({sourceId:"pcexpress"},[{sourceId:"pcfactory-montt",status:"in_stock"}])).toBe("unknown");
});
it("selects the hours for the requested date",()=>{
 const store={weekly:{1:["09:00","18:00"],2:["10:00","17:00"]}};
 expect(hoursOnDate(store,"2026-11-16")).toEqual(["09:00","18:00"]);
 expect(hoursOnDate(store,"2026-11-15")).toBeNull();
});
