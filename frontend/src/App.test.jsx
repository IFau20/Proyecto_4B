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
 window.sessionStorage.clear();
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
 expect(validDeals([source],new Date("2026-11-14T12:00:00Z"))).toHaveLength(0);
});

it("ignores bank-card-only discounts and prices in featured deals",()=>{
 const card={...sample[0],offers:[{...sample[0].offers[0],
   paymentCondition:"Tarjeta Cencosud",listPriceClp:800000,priceClp:500000}]};
 expect(validDeals([card])).toHaveLength(0);
 const named={...sample[0],offers:[{...sample[0].offers[0],
   sourceName:"Ripley · tarjeta de crédito"}]};
 expect(validDeals([named])).toHaveLength(0);
});
it("shows a small referential label without verification counts",async()=>{
 const reference={...sample[0],offers:[{sourceId:"shop",sourceName:"Shop",
   url:"https://shop.test/item",priceClp:null,referencePriceClp:560000,availability:"unknown"}]};
 fetch.mockImplementation(async url=>({ok:true,json:async()=>url==="/api/notebooks"?[reference]:[]}));
 render(<App/>);
 expect(await screen.findByText("Precio referencial")).toBeInTheDocument();
 expect(screen.queryByText(/precios verificados/i)).not.toBeInTheDocument();
 expect(screen.queryByText(/NOTEBOOK/)).not.toBeInTheDocument();
});

it("keeps a store's regular 20-percent discount even when a separate card-only rate exists",()=>{
 const deal={...sample[0],offers:[{
   ...sample[0].offers[0],priceClp:629990,listPriceClp:869990,
   paymentCondition:"Tarjeta Cencosud",standardPriceClp:629990,cardPriceClp:624990
 }]};
 expect(validDeals([deal])).toHaveLength(1);
 expect(validDeals([deal])[0].priceClp).toBe(629990);
});

it("labels a historical last price with its date, without presenting it as a current offer",async()=>{
 const legacy={...sample[0],offers:[],imageUrl:null,historicalPriceClp:699990,
  historicalObservedAt:"2026-10-20T12:00:00Z"};
 fetch.mockImplementation(async url=>({ok:true,json:async()=>url==="/api/notebooks"?[legacy]:[]}));
 render(<App/>);
 expect(await screen.findByText("Último precio registrado",{exact:false})).toBeInTheDocument();
 expect(screen.getByText("$699.990")).toBeInTheDocument();
 expect(screen.queryByText("Precio referencial")).not.toBeInTheDocument();
});

import {paginateNotebooks,PAGE_SIZE} from "./App.jsx";
it("limits catalog pages to 12 and clamps out-of-range pages",()=>{
 const products=Array.from({length:31},(_,i)=>({sku:String(i)}));
 expect(PAGE_SIZE).toBe(12);
 expect(paginateNotebooks(products,1).items).toHaveLength(12);
 expect(paginateNotebooks(products,2).items[0].sku).toBe("12");
 expect(paginateNotebooks(products,3).items).toHaveLength(7);
 expect(paginateNotebooks(products,99).page).toBe(3);
 expect(paginateNotebooks([],1).items).toHaveLength(0);
});
it("moves between groups of 12 without losing filters",async()=>{
 const products=Array.from({length:26},(_,i)=>({
   ...sample[0],id:String(i),sku:"SKU"+i,name:"Notebook "+i,
 }));
 fetch.mockImplementation(async(url)=>({ok:true,json:async()=>url==="/api/notebooks"?products:[]}));
 render(<App/>);
 await screen.findByRole("heading",{name:"Notebook 1"});
 expect(within(document.querySelector(".computer-grid")).getByRole("heading",{name:"Notebook 0"})).toBeInTheDocument();
 expect(within(document.querySelector(".computer-grid")).queryByRole("heading",{name:"Notebook 12"})).not.toBeInTheDocument();
 fireEvent.click(screen.getByRole("button",{name:"Página siguiente"}));
 expect(within(document.querySelector(".computer-grid")).getByRole("heading",{name:"Notebook 12"})).toBeInTheDocument();
 expect(within(document.querySelector(".computer-grid")).queryByRole("heading",{name:"Notebook 0"})).not.toBeInTheDocument();
 expect(screen.getByText(/Página 2 de 3/)).toBeInTheDocument();
});

it("shows notebook specifications quickly even while store prices are pending",async()=>{
 const data=sample.map(product=>({...product,offers:[]}));
 let completeFresh;
 fetch.mockImplementation(async url=>{
   if(url==="/api/notebooks?preview=1")return {ok:true,json:async()=>data};
   if(url==="/api/notebooks")return new Promise(resolve=>{completeFresh=resolve;});
   return {ok:true,json:async()=>[]};
 });
 const {container}=render(<App/>);
 await screen.findByRole("heading",{name:"HP Victus"});
 expect(within(container.querySelector(".computer-grid")).getAllByRole("article")).toHaveLength(2);
 expect(screen.getByText("Actualizando precios y descuentos…")).toBeInTheDocument();
 completeFresh({ok:true,json:async()=>sample});
 expect(await screen.findByRole("link",{name:"Ver oferta en tienda"})).toBeInTheDocument();
});
it("shows cached catalog immediately on repeat visits even if network is pending",async()=>{
 sessionStorage.setItem("pc-tracker-catalog-v2",JSON.stringify({at:Date.now(),data:sample}));
 fetch.mockImplementation(async url=>url==="/api/notebooks"?
   new Promise(()=>{}):{ok:true,json:async()=>[]});
 const {container}=render(<App/>);
 expect(within(container.querySelector(".computer-grid")).getByRole("heading",{name:"HP Victus"})).toBeInTheDocument();
 expect(screen.getByText("Actualizando precios y descuentos…")).toBeInTheDocument();
});

it("compares three distinct published retailer prices without calling them live-verified",async()=>{
 const offers=[
  {sourceId:"a",sourceName:"Tienda A",priceClp:null,referencePriceClp:550000,url:"https://a.cl"},
  {sourceId:"b",sourceName:"Tienda B",priceClp:null,referencePriceClp:500000,url:"https://b.cl"},
  {sourceId:"c",sourceName:"Tienda C",priceClp:null,referencePriceClp:570000,url:"https://c.cl"},
 ];
 fetch.mockImplementation(async url=>({ok:true,json:async()=>url==="/api/notebooks"?[
 {...sample[0],offers}]:[]}));
 const {container}=render(<App/>);
 await screen.findByRole("heading",{name:"HP 15-fd0331la"});
 fireEvent.click(within(container.querySelector(".computer-grid")).getByRole("button",{name:"Comparar tiendas (3)"}));
 expect(screen.getByText(/Comparación de precios publicados de al menos tres comercios/)).toBeInTheDocument();
 expect(screen.getByText("$70.000")).toBeInTheDocument();
 expect(screen.queryByText(/Diferencia entre precios verificados/)).not.toBeInTheDocument();
});
