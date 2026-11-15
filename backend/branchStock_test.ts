import {strictEqual as equal} from "node:assert/strict";
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
