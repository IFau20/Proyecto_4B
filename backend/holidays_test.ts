import {strictEqual as equal,deepStrictEqual as same,rejects} from "node:assert/strict";
import {validChileanDate,parseChileanHolidays,holidayOn} from "./holidays.ts";
Deno.test("rejects invalid calendar dates and accepts real ones",()=>{
 equal(validChileanDate("2026-02-30"),false);
 equal(validChileanDate("2026-12-25"),true);
 equal(validChileanDate("2026-13-01"),false);
});
Deno.test("parses 2026 holidays with irreducible closure warning",()=>{
 const data={feriados:{diciembre:[{mes:12,dia:25,descripcion:"Navidad",irrenunciable:true}]}};
 const result=parseChileanHolidays(data,2026);
 same(result.get("2026-12-25"),{date:"2026-12-25",name:"Navidad",irrenunciable:true,source:"feriados.devschile.cl"});
});
Deno.test("queries public calendar, not user coordinates, and caches same-year dates",async()=>{
 let requests=0;
 const fake=async(url:string)=>{requests++;equal(url.endsWith("/2028"),true);return Response.json({
 feriados:{mayo:[{mes:5,dia:1,descripcion:"Trabajo",irrenunciable:true}]}
 });};
 equal((await holidayOn("2028-05-01",fake as typeof fetch))?.name,"Trabajo");
 equal(await holidayOn("2028-05-02",fake as typeof fetch),null);
 equal(requests,1);
});

Deno.test("calendar failure is not reported as a verified non-holiday",async()=>{
 await rejects(()=>holidayOn("2030-12-25",(async()=>{throw Error("offline");}) as typeof fetch),/calendar|offline|unavailable/i);
});
Deno.test("malformed calendar response is not accepted as an empty calendar",async()=>{
 await rejects(()=>holidayOn("2027-12-25",(async()=>Response.json({error:"maintenance"})) as typeof fetch),/calendar|invalid/i);
});
