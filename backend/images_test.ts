import {strictEqual as equal} from "node:assert/strict";
import {isAllowedNotebookImage,proxyNotebookImage} from "./images.ts";
const laptop={sku:"D0CJ4LA",imageUrl:"https://api.solotodo.com/product.jpg"};
Deno.test("only accepts HTTPS images on approved hostnames",()=>{
 equal(isAllowedNotebookImage("https://api.solotodo.com/product.jpg"),true);
 equal(isAllowedNotebookImage("https://solotodo.com.evil.test/photo.jpg"),false);
 equal(isAllowedNotebookImage("http://localhost:8080/private.png"),false);
 equal(isAllowedNotebookImage("https://127.0.0.1/image.jpg"),false);
});
Deno.test("same-origin proxy returns validated image content",async()=>{
 const fake=async()=>new Response(new Uint8Array([137,80,78,71]),{headers:{"content-type":"image/png"}});
 const result=await proxyNotebookImage("D0CJ4LA",[laptop] as any,fake as typeof fetch);
 equal(result.status,200);
 equal(result.headers.get("content-type"),"image/png");
});
Deno.test("proxy refuses arbitrary image requests and unsupported content types",async()=>{
 const fake=async()=>new Response("<html>nope</html>",{headers:{"content-type":"text/html"}});
 equal((await proxyNotebookImage("UNKNOWN",[laptop] as any,fake as typeof fetch)).status,404);
 equal((await proxyNotebookImage("D0CJ4LA",[{...laptop,imageUrl:"https://evil.test/" }] as any,fake as typeof fetch)).status,404);
});

Deno.test("curated model-family image is used for Lenovo's blocked picture endpoint",async()=>{
 let requested="";
 const fake=async (url:string)=>{requested=url;return new Response(new Uint8Array([137,80,78,71]),{headers:{"content-type":"image/png"}});};
 const result=await proxyNotebookImage("83JC0080CL",[{sku:"83JC0080CL",imageUrl:"https://api.solotodo.com/products/255350/picture/"}] as any,fake as typeof fetch);
 equal(result.status,200);
 equal(requested.includes("p4-ofp.static.pub"),true);
});
