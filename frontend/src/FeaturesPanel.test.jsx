import { translate } from "./i18n.js";
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

it("finds confirmed stock beyond the first six branches instead of truncating before filtering",()=>{
 const stores=Array.from({length:8},(_,i)=>({sourceId:"s"+i,name:"Store "+i,address:"Santiago",lat:-33.4-i*.001,lon:-70.6}));
 const records=[{sourceId:"s7",status:"in_stock"},{sourceId:"s0",status:"out_of_stock"}];
 expect(nearestSixStores(stores,{lat:-33.4,lon:-70.6},records).map(s=>s.sourceId)).toEqual(["s7"]);
 expect(nearestSixStores(stores,{lat:-33.4,lon:-70.6},[])).toEqual([]);
});

import {render,screen,fireEvent} from "@testing-library/react";
import {vi} from "vitest";
import FeaturesPanel from "./FeaturesPanel.jsx";
it("shows only confirmed nearby branches and lets users include unknown stores",async()=>{
 vi.stubGlobal("navigator",{geolocation:{getCurrentPosition:success=>success({coords:{latitude:-33.4,longitude:-70.6}})}});
 const stores=Array.from({length:8},(_,i)=>({sourceId:"s"+i,name:"Branch "+i,address:"Santiago",lat:-33.4-i*.001,lon:-70.6,weekly:{},scheduleVerified:false,contactUrl:"https://shop.cl"}));
 vi.stubGlobal("fetch",vi.fn(async url=>({ok:true,json:async()=>String(url).startsWith("/api/stores")?stores:
  String(url).startsWith("/api/branch-stock")?{sku:"83JE0184CL",records:[{sourceId:"s7",sku:"83JE0184CL",status:"in_stock",quantity:2,checkedAt:"2026-11-15T08:00:00Z"}]}:
  String(url).startsWith("/api/holidays")?{holiday:null,status:"calendar_unavailable"}:{sources:[],points:[],observations:0}})));
 const {container}=render(<FeaturesPanel liveComputer={{sku:"83JE0184CL",offers:[]}} t={translate} locale="es"/>);
 fireEvent.click(screen.getByRole("button",{name:"Buscar cerca de mí"}));
 expect(await screen.findByRole("heading",{name:"1. Branch 7"})).toBeInTheDocument();
 expect(container.querySelectorAll(".store-card")).toHaveLength(1);
 expect(screen.getByText("No se pudo verificar el calendario de feriados.")).toBeInTheDocument();
 fireEvent.click(screen.getByRole("checkbox",{name:"Solo sucursales con stock confirmado"}));
 expect(container.querySelectorAll(".store-card")).toHaveLength(6);
 vi.unstubAllGlobals();
});
it.each(["http","network"])("reports %s inventory outages separately from a successful empty search",async failure=>{
 vi.stubGlobal("navigator",{geolocation:{getCurrentPosition:success=>success({coords:{latitude:-33.4,longitude:-70.6}})}});
 vi.stubGlobal("fetch",vi.fn(async url=>{
  if(String(url).startsWith("/api/branch-stock")){
   if(failure==="network")throw Error("offline");
   return {ok:false,status:503,json:async()=>({error:"unavailable"})};
  }
  return {ok:true,json:async()=>String(url).startsWith("/api/stores")?[]:String(url).startsWith("/api/holidays")?{holiday:null}:{sources:[],points:[],observations:0}};
 }));
 render(<FeaturesPanel liveComputer={{sku:"83JE0184CL",offers:[]}} t={translate} locale="es"/>);
 fireEvent.click(screen.getByRole("button",{name:"Buscar cerca de mí"}));
 expect(await screen.findByRole("alert")).toHaveTextContent("No se pudo verificar el stock por sucursal.");
 expect(screen.getByRole("button",{name:"Reintentar stock"})).toBeInTheDocument();
});
it("updates weekday, distance and error labels with the active language",async()=>{
 vi.stubGlobal("navigator",{geolocation:{getCurrentPosition:success=>success({coords:{latitude:-33.4,longitude:-70.6}})}});
 const store={sourceId:"shop",name:"Branch",address:"Santiago",lat:-33.4,lon:-70.6,scheduleVerified:true,weekly:{1:["09:00","18:00"]},contactUrl:"https://shop.cl"};
 vi.stubGlobal("fetch",vi.fn(async url=>({ok:true,json:async()=>String(url).startsWith("/api/stores")?[store]:String(url).startsWith("/api/branch-stock")?{sku:"sku",records:[{sourceId:"shop",status:"in_stock"}]}:String(url).startsWith("/api/holidays")?{holiday:null}:{sources:[]}})));
 const computer={sku:"sku",offers:[]};
 const {rerender}=render(<FeaturesPanel liveComputer={computer} locale="es" t={(key,values)=>translate(key,"es",values)}/>);
 fireEvent.click(screen.getByRole("button",{name:"Buscar cerca de mí"}));
 await screen.findByRole("heading",{name:"1. Branch"});
 fireEvent.change(screen.getByLabelText("Fecha de consulta"),{target:{value:"2026-11-16"}});
 expect(screen.getByText("Lun 09:00–18:00 · Horario habitual comprobado")).toBeInTheDocument();
 expect(screen.getByText("0,0 km")).toBeInTheDocument();
 rerender(<FeaturesPanel liveComputer={computer} locale="en" t={(key,values)=>translate(key,"en",values)}/>);
 expect(screen.getByText("Mon 09:00–18:00 · Regular opening hours checked")).toBeInTheDocument();
 expect(screen.getByText("0.0 km")).toBeInTheDocument();
});
it("retranslates an existing location failure after changing language",()=>{
 vi.stubGlobal("navigator",{});
 vi.stubGlobal("fetch",vi.fn(()=>new Promise(()=>{})));
 const computer={sku:"sku",offers:[]};
 const {rerender}=render(<FeaturesPanel liveComputer={computer} locale="es" t={(key,values)=>translate(key,"es",values)}/>);
 fireEvent.click(screen.getByRole("button",{name:"Buscar cerca de mí"}));
 expect(screen.getByRole("alert")).toHaveTextContent("Geolocalización no disponible.");
 rerender(<FeaturesPanel liveComputer={computer} locale="en" t={(key,values)=>translate(key,"en",values)}/>);
 expect(screen.getByRole("alert")).toHaveTextContent("Geolocation unavailable.");
});
