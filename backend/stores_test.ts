import {strictEqual as equal} from "node:assert/strict";
import {STORES,verifyHours,distanceKm,checkStores} from "./stores.ts";
Deno.test("three stores have geocodable locations",()=>{
 equal(STORES.length,3);
 equal(STORES.every(s=>Number.isFinite(s.lat)&&Number.isFinite(s.lon)),true);
});
Deno.test("hours require both address and time strings",()=>{
 equal(verifyHours("Los Leones 1707 lunes viernes 09:00 a 17:45",STORES[0]),true);
 equal(verifyHours("Los Leones 1707 no se publican horarios",STORES[0]),false);
});
Deno.test("distance is zero at same point and positive at another",()=>{
 equal(distanceKm(-33.4349,-70.6017,-33.4349,-70.6017),0);
 equal(distanceKm(-33.4349,-70.6017,-33.4478,-70.611)>0,true);
});
Deno.test("failed fetch does not pretend official hours were checked",async()=>{
 const data=await checkStores((async()=>new Response("",{status:503})) as typeof fetch);
 equal(data.every(s=>!s.scheduleVerified),true);
});
