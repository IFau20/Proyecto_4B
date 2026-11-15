import {strictEqual as equal,rejects} from "node:assert/strict";
import {parseBranchInventory,branchStockForSku} from "./branchStock.ts";
Deno.test("only explicitly labelled branch quantities count as in-store stock",()=>{
 const sku="83JC0080CL";
 const html="<p>SKU: "+sku+"</p><h2>Disponibilidad de retiro en tienda</h2>"+
  "<p>Manuel Montt 3 unidades</p><p>Mall Plaza Norte 0 unidades</p>";
 const result=parseBranchInventory(html,sku,"https://www.pcfactory.cl/producto/123","2026-11-15T00:00:00Z");
 equal(result.find(x=>x.sourceId==="pcfactory-montt")?.status,"in_stock");
 equal(result.find(x=>x.sourceId==="pcfactory-montt")?.quantity,3);
 equal(result.find(x=>x.sourceId==="pcfactory-norte")?.status,"out_of_stock");
});
Deno.test("web stock or a different SKU never proves branch inventory",()=>{
 equal(parseBranchInventory("SKU: 83JC0080CL Stock online 30","83JC0080CL","https://www.pcfactory.cl/producto/123","2026-11-15T00:00:00Z").length,0);
 equal(parseBranchInventory("SKU: OTHER Tienda Manuel Montt Stock: 3","83JC0080CL","https://www.pcfactory.cl/producto/123","2026-11-15T00:00:00Z").length,0);
});
Deno.test("unknown SKU provides no branch inventory",async()=>{
 equal((await branchStockForSku("NOT-REAL")).length,0);
});

Deno.test("reads real pc Factory branch stock quantities but ignores web-wide total",()=>{
 const sku="83JC0080CL";
 const html="<h1>LOQ "+sku+"</h1><p>+100 disponibles</p>"+
   "<h2>Disponibilidad de retiro en tienda</h2>"+
   "<li>Manuel Montt 19 unidades</li><li>Mall Plaza Norte 6 unidades</li>"+
   "<li>Mall Costanera Center 15 unidades</li><li>Viña del Mar 10 unidades</li>";
 const result=parseBranchInventory(html,sku,"https://www.pcfactory.cl/producto/123","2026-11-15T00:00:00Z");
 equal(result.find(x=>x.sourceId==="pcfactory-montt")?.quantity,19);
 equal(result.find(x=>x.sourceId==="pcfactory-norte")?.quantity,6);
 equal(result.find(x=>x.sourceId==="pcfactory-costanera")?.quantity,15);
 equal(result.find(x=>x.sourceId==="pcfactory-vina")?.quantity,10);
});

Deno.test("branch endpoint falls back to public product API when HTML has no inventory",async()=>{
 const sku="83JE0184CL";
 const records=await branchStockForSku(sku,(async(url)=>{
  const path=String(url);
  if(path.includes("api.pcfactory.cl"))return Response.json(path.endsWith("/stock")?
   {id:55428,disponibilidad:[{sucursales:[{id:2,nombre:"Manuel Montt",aproximado:"12",retiro:true,cerrada:false}]}]}:
   path.endsWith("/precio")?{id:55428,precio:{efectivo:1419990,normal:1463890}}:{id:55428,partNumber:sku});
  return new Response("<html>JavaScript product shell</html>");
 }) as typeof fetch);
 equal(records.find(r=>r.sourceId==="pcfactory-montt")?.quantity,12);
});

Deno.test("a missing discovery result is not cached as ten minutes of no branch stock",async()=>{
 const sku="D0CJ4LA";
 let calls=0;
 const lookup=async()=>{calls++;return calls===1?null:{sku,offers:[{sourceName:"PC Factory",url:"https://www.pcfactory.cl/producto/54123"}]};};
 const fetcher=(async(url)=>Response.json(String(url).endsWith("/stock")?
  {id:54123,disponibilidad:[{sucursales:[{id:2,aproximado:"3",retiro:true}]}]}:
  String(url).endsWith("/precio")?{id:54123,precio:{efectivo:469990}}:{id:54123,partNumber:sku})) as typeof fetch;
 equal((await branchStockForSku(sku,fetcher,lookup)).length,0);
 equal((await branchStockForSku(sku,fetcher,lookup))[0]?.quantity,3);
});
Deno.test("failed stock requests are retried rather than cached as no inventory",async()=>{
 const sku="83JE0184CL";let failed=true;
 const lookup=async()=>({sku,offers:[{url:"https://www.pcfactory.cl/producto/55428"}]});
 const fetcher=(async(url)=>{
  if(failed)return new Response("offline",{status:503});
  return Response.json(String(url).endsWith("/stock")?{id:55428,disponibilidad:[{sucursales:[{id:2,aproximado:"4",retiro:true}]}]}:
   String(url).endsWith("/precio")?{id:55428,precio:{efectivo:1419990}}:{id:55428,partNumber:sku});
 }) as typeof fetch;
 await rejects(()=>branchStockForSku(sku,fetcher,lookup),/inventory|stock/i);failed=false;
 equal((await branchStockForSku(sku,fetcher,lookup))[0]?.quantity,4);
});
