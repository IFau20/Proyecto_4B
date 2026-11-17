import { strictEqual as equal } from "node:assert/strict";
import { createHostedHandler } from "./hostedHandler.ts";

Deno.test("daily collector rejects missing secrets and unauthorized visitors before collection",async()=>{
 let collections=0;
 const handler=createHostedHandler({collect:async()=>{collections++;},setting:()=>""});
 equal((await handler(new Request("https://tracker.invalid/api/collect-history",{headers:{Authorization:"Bearer undefined"}}))).status,503);
 const protectedHandler=createHostedHandler({collect:async()=>{collections++;},setting:()=>"cron-test-secret"});
 for(const authorization of ["","Bearer undefined","Bearer wrong"]){
  equal((await protectedHandler(new Request("https://tracker.invalid/api/collect-history",{headers:{Authorization:authorization}}))).status,401);
 }
 equal(collections,0);
 equal((await protectedHandler(new Request("https://tracker.invalid/api/collect-history",{headers:{Authorization:"Bearer cron-test-secret"}}))).status,200);
 equal(collections,1);
});
Deno.test("hosted adapter preserves API request paths and reports collection failures",async()=>{
 let path="";
 const handler=createHostedHandler({
  requestHandler:async(request)=>{path=new URL(request.url).pathname;return Response.json({ok:true});},
  collect:async()=>{throw Error("private diagnostic");},setting:()=>"test-secret",
 });
 equal((await handler(new Request("https://tracker.invalid/api/notebooks?preview=1"))).status,200);
 equal(path,"/api/notebooks");
 const failure=await handler(new Request("https://tracker.invalid/api/collect-history",{headers:{Authorization:"Bearer test-secret"}}));
 equal(failure.status,503);equal((await failure.text()).includes("private diagnostic"),false);
});
