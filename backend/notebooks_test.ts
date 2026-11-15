import { strictEqual as equal } from "node:assert/strict";
import { NOTEBOOKS,calcDiscount,parseStorePage } from "./notebooks.ts";
Deno.test("all catalog entries are real notebooks with unique manufacturer SKUs",()=>{
  equal(NOTEBOOKS.length>=10,true);
  equal(new Set(NOTEBOOKS.map(x=>x.sku)).size,NOTEBOOKS.length);
  equal(NOTEBOOKS.every(x=>x.ramGb>0&&x.name&&!x.name.includes("(")),true);
});
Deno.test("discount requires normal and current price from SAME retailer",()=>{
  equal(calcDiscount(799990,999990),20);
  equal(calcDiscount(800000,999990),null);
  equal(calcDiscount(null,1000000),null);
  equal(calcDiscount(999990,999990),null);
});
Deno.test("SP Digital price is based on exact model plus named transfer and normal price",()=>{
  const s="<div>Part number: D0CJ4LA#ABM</div><p>Normal $1.040.890 Descuento 19% DCTO. Pago con transferencia $842.800</p>";
  const p=parseStorePage(s,"D0CJ4LA","spdigital");
  equal(p.priceClp,842800);
  equal(p.listPriceClp,1040890);
  equal(p.discountPercent,null);
  equal(parseStorePage(s,"BA1U9LA","spdigital").priceClp,null);
});
Deno.test("Paris same product price and discount can be identified",()=>{
  const s="<h1>Samsung Galaxy Book4</h1><p>Modelo NP750XGJ-KS5CL</p><span>25% $524.990 $699.990</span>";
  const p=parseStorePage(s,"NP750XGJ-KS5CL","paris");
  equal(p.discountPercent,25);
  equal(p.priceClp,524990);
});
Deno.test("an unknown store never produces a made-up price",()=>{
  equal(parseStorePage("SKU:ABCD Oferta $400.000", "ABCD", "unknown").priceClp,null);
});
