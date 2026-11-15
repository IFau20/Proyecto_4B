import {strictEqual as equal} from "node:assert/strict";
import {fetchPcFactoryProduct,parsePcFactoryProduct} from "./pcFactory.ts";
const product={id:55428,partNumber:"83JE0184CL"};
const price={id:55428,precio:{normal:1463890,efectivo:1419990,debito:1428790,bancoEstado:999990}};
const stock={id:55428,disponibilidad:[{sucursales:[
 {id:2,nombre:"Manuel Montt",aproximado:"12",retiro:true,cerrada:false},
 {id:42,nombre:"Open Kennedy",aproximado:"0",retiro:true,cerrada:false},
 {id:11,nombre:"Internet",aproximado:"1",retiro:false,despacho:true},
 {id:22,nombre:"Mall Costanera Center",aproximado:"10",retiro:true,cerrada:true},
 {id:48,nombre:"Las Condes",aproximado:"4",retiro:false},
]}]};
Deno.test("PC Factory validates identity and separates cash price, online stock and pickup stock",()=>{
 const result=parsePcFactoryProduct(product,price,stock,"83JE0184CL",55428,"2026-11-15T08:00:00Z");
 equal(result?.priceClp,1419990);equal(result?.availability,"in_stock");
 equal(result?.branches.find(b=>b.sourceId==="pcfactory-montt")?.quantity,12);
 equal(result?.branches.find(b=>b.sourceId==="pcfactory-kennedy")?.status,"out_of_stock");
 equal(result?.branches.find(b=>b.sourceId==="pcfactory-costanera")?.closedAtCheck,true);
 equal(result?.branches.length,3);
 equal(parsePcFactoryProduct({...product,partNumber:"83JE0184CL-OTHER"},price,stock,"83JE0184CL",55428,"now"),null);
 equal(parsePcFactoryProduct(product,{...price,id:999},stock,"83JE0184CL",55428,"now")?.priceClp,null);
 equal(parsePcFactoryProduct(product,price,{...stock,id:999},"83JE0184CL",55428,"now")?.branches.length,0);
});
Deno.test("PC Factory adapter calls only the public API for a trusted product URL",async()=>{
 const requested:string[]=[];
 const result=await fetchPcFactoryProduct("https://www.pcfactory.cl/producto/55428","83JE0184CL",(async (url)=>{
  requested.push(String(url));return Response.json(String(url).endsWith("/stock")?stock:String(url).endsWith("/precio")?price:product);
 }) as typeof fetch);
 equal(result?.priceClp,1419990);equal(result?.branches.length,3);
 equal(requested.every(u=>u.startsWith("https://api.pcfactory.cl/pcfactory-services-catalogo/v1/catalogo/productos/55428")),true);
 equal(await fetchPcFactoryProduct("https://evil.example/producto/55428","83JE0184CL"),null);
});
Deno.test("PC Factory permits only the optional regional hash suffix, not other model suffixes",()=>{
 equal(parsePcFactoryProduct({...product,partNumber:"83JE0184CL#ABM"},price,stock,"83JE0184CL",55428,"now")?.priceClp,1419990);
});
Deno.test("promotional savings use reference price rather than current other-payment price",()=>{
 equal(parsePcFactoryProduct(product,price,stock,"83JE0184CL",55428,"now")?.listPriceClp,null);
 equal(parsePcFactoryProduct(product,{...price,precio:{...price.precio,referencia:1599990}},stock,"83JE0184CL",55428,"now")?.listPriceClp,1599990);
});
