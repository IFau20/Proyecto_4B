import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import App, { validDeals } from "./App.jsx";

const sample=[
 {id:"1",sku:"D0CJ4LA",name:"HP 15-fd0331la",ramGb:8,gpu:"Intel UHD",processor:"Intel Core 3",isLive:true,
  imageUrl:"https://example.com/notebook.jpg",offers:[
    {sourceId:"spdigital",sourceName:"SP Digital",url:"https://spdigital.cl/item",priceClp:500000,listPriceClp:700000,discountPercent:29,availability:"in_stock"}
  ]},
 {id:"2",sku:"BA1U9LA",name:"HP Victus",ramGb:16,gpu:"RTX 3050",processor:"Ryzen 5",isLive:true,imageUrl:null,offers:[]}
];
beforeEach(()=>{
 vi.stubGlobal("fetch",vi.fn(async (url)=>({ok:true,json:async()=>url==="/api/notebooks"?sample:
   url==="/api/auth/me"?{enabled:false,user:null}:[]})));
 window.localStorage.clear();
 document.documentElement.removeAttribute("data-theme");
});
describe("real notebook storefront",()=>{
 it("renders only real notebooks from API and no demo label",async()=>{
  render(<App/>);
  await screen.findByRole("heading",{name:"HP Victus"});
  expect(within(document.querySelector(".computer-grid")).getByRole("heading",{name:"HP 15-fd0331la"})).toBeInTheDocument();
  expect(screen.getByRole("heading",{name:"HP Victus"})).toBeInTheDocument();
  expect(screen.queryByText(/ficticios/i)).not.toBeInTheDocument();
  expect(screen.queryByText(/AVANCE 05/)).not.toBeInTheDocument();
 });
 it("filters notebooks by GPU and RAM",async()=>{
  render(<App/>); await screen.findByRole("heading",{name:"HP Victus"});
  fireEvent.change(screen.getByLabelText("RAM mínima"),{target:{value:"16"}});
  expect(within(document.querySelector(".computer-grid")).queryByRole("heading",{name:"HP 15-fd0331la"})).not.toBeInTheDocument();
 });
 it("hides unconfigured SSO and preserves dark mode",async()=>{
  render(<App/>); await screen.findByRole("heading",{name:"HP Victus"});
  expect(screen.queryByText(/SSO sin configurar/)).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button",{name:"Activar modo oscuro"}));
  expect(document.documentElement).toHaveAttribute("data-theme","dark");
  expect(window.localStorage.getItem("pc-tracker-theme")).toBe("dark");
 });
 it("only highlights discounts >=20% within the same retailer",()=>{
  expect(validDeals(sample)).toHaveLength(1);
  expect(validDeals([{...sample[0],offers:[{...sample[0].offers[0],listPriceClp:580000}]}])).toHaveLength(0);
 });
 it("renders discount carousel and source link",async()=>{
  render(<App/>);await screen.findByRole("heading",{name:"HP Victus"});
  expect(screen.getByRole("link",{name:"Ver oferta en tienda"})).toHaveAttribute("href","https://spdigital.cl/item");
  expect(screen.getByText("-29%")).toBeInTheDocument();
 });
 it("switches Spanish to English",async()=>{
  render(<App/>); await screen.findByRole("heading",{name:"HP Victus"});
  fireEvent.click(screen.getByRole("button",{name:"Switch to English"}));
  expect(document.documentElement).toHaveAttribute("lang","en");
 });
});

it("includes only recent sourced retailer markdowns as reference offers",()=>{
 const source={...sample[0],offers:[
   {sourceId:"paris2",sourceName:"Paris",url:"https://paris.cl/test",
     priceClp:null,referencePriceClp:624990,referenceNormalPriceClp:869990,
     referenceObservedOn:"2026-11-15",availability:"unknown"}
 ]};
 const found=validDeals([source],new Date("2026-11-15T12:00:00Z"));
 expect(found).toHaveLength(1);
 expect(found[0].isReference).toBe(true);
 expect(validDeals([source],new Date("2026-12-01T12:00:00Z"))).toHaveLength(0);
});
