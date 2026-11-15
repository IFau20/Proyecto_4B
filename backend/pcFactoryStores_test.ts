import {strictEqual as equal,deepStrictEqual as same} from "node:assert/strict";
import {parseWeeklyHours,parsePcFactoryStores} from "./pcFactoryStores.ts";
Deno.test("scrapes weekly hours without applying dated notices as regular hours",()=>{
 same(parseWeeklyHours("<p>Lunes a Viernes 09:30 a 19:00&nbsp;<br>Sábado 10:00 a 14:00</p>"),{1:["09:30","19:00"],2:["09:30","19:00"],3:["09:30","19:00"],4:["09:30","19:00"],5:["09:30","19:00"],6:["10:00","14:00"]});
 equal(parseWeeklyHours("Lunes 25 de Mayo 10:00 a 12:00")[1],undefined);
 same(parseWeeklyHours("Lunes Jueves 10:00 a 20:30<br>Viernes y sábado 10:00 a 21:00<br>Domingo - 11:00 a 20:30")[0],["11:00","20:30"]);
});
Deno.test("uses the retailer widget general schedule and branch coordinates",()=>{
 const stores=[{meta:{name:"Manuel Montt",tags:["horario-calle"]},fields:{id:"2","Horario General":["Si"],Horario:"Lunes 10:00 a 11:00",Direccion:[{location:{lat:"-33.430",lon:"-70.619"},location_street:"Avenida Manuel Montt 170, Chile"}]}}];
 const schedules=[{meta:{slug:"horario-calle"},fields:{Horario:"Lunes a Viernes 09:30 a 19:00"}}];
 const result=parsePcFactoryStores("var $stores = "+JSON.stringify(stores)+"; var $schedules = "+JSON.stringify(schedules)+";");
 same(result[0].weekly[1],["09:30","19:00"]);equal(result[0].sourceId,"pcfactory-montt");equal(result[0].lat,-33.430);
 same(parsePcFactoryStores("<html>error</html>"),[]);
});
Deno.test("preserves branch closure notices even when general weekly hours apply",()=>{
 const stores=[{meta:{tags:["horario-calle"]},fields:{id:"24","Horario General":["Si"],Horario:"<strong>Cerrado hasta nuevo aviso</strong><p>Lunes a Viernes 09:30 a 19:00</p>"}}];
 const schedules=[{meta:{slug:"horario-calle"},fields:{Horario:"Lunes a Viernes 09:30 a 19:00"}}];
 const result=parsePcFactoryStores('var $stores = '+JSON.stringify(stores)+'; var $schedules = '+JSON.stringify(schedules)+';');
 equal(result[0].closedUntilNotice,true);
 equal(result[0].scheduleNotice?.includes("Cerrado hasta nuevo aviso"),true);
});
