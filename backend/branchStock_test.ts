import {strictEqual as equal} from "node:assert/strict";
import {parseBranchInventory,branchStockForSku} from "./branchStock.ts";
Deno.test("only explicitly labelled branch quantities count as in-store stock",()=>{
 const sku="83JC0080CL";
 const html="<p>SKU: "+sku+"</p><p>Tienda Manuel Montt Stock: 3 unidades</p>"+
  "<p>Tienda Plaza Norte Stock: 0 unidades</p>";
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
