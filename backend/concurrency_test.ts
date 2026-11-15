import {strictEqual as equal,deepStrictEqual as same,rejects} from "node:assert/strict";
import {mapWithConcurrency} from "./concurrency.ts";
Deno.test("bounded scheduler preserves source ordering and limits in-flight jobs",async()=>{
 let active=0,maximum=0;
 const results=await mapWithConcurrency(Array.from({length:11},(_,i)=>i),3,async(i)=>{
  active++;maximum=Math.max(maximum,active);
  await new Promise(resolve=>setTimeout(resolve,1+i%3));
  active--;return i*2;
 });
 same(results,Array.from({length:11},(_,i)=>i*2));
 equal(maximum<=3,true);
});
Deno.test("bounded scheduler supports empty batch and rejects invalid limit",async()=>{
 same(await mapWithConcurrency([],3,async v=>v),[]);
 await rejects(()=>mapWithConcurrency([1],0,async v=>v),RangeError);
});
