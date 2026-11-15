import {strictEqual as equal} from "node:assert/strict";
import {isAllowedNotebookImage,proxyNotebookImage,additionalNotebookImages} from "./images.ts";
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

Deno.test("falls back to a second real product image when the first CDN rejects it",async()=>{
 const urls:string[]=[];
 const fake=async(url:string)=>{urls.push(url);
   if(url.includes("media-cdn.bnn.in.th"))return new Response("",{status:406});
   if(url.includes("microless.com"))return new Response(new Uint8Array([255,216,255,217]),{headers:{"content-type":"image/jpeg"}});
   return new Response("",{status:404});
 };
 const product=[{sku:"82XM00M4CL",imageUrl:"https://api.solotodo.com/invalid"}];
 const response=await proxyNotebookImage("82XM00M4CL",product as any,fake as typeof fetch);
 equal(response.status,200);
 equal(urls.includes("https://microless.com/cdn/products/5c86bbccc5832797c338837ff97bd8b9-hi.jpg"),true);
});
Deno.test("all missing-image models have product-family alternative candidates",()=>{
 for(const sku of ["82XM00M4CL","BA1U9LA","CH8Z6LA","83GSX029CL","NH.DADAL.002.1"]){
   equal((additionalNotebookImages[sku]??[]).length>0,true);
 }
});
