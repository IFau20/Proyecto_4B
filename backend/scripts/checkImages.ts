import {getNotebooks} from "../notebooks.ts";
import {proxyNotebookImage} from "../images.ts";
const notebooks=await getNotebooks();
for(const sku of ["83JC0080CL","DB9V5AT#ABM","82XM00M4CL","BA1U9LA","CH8Z6LA","83GSX029CL","83GSX013CL","NH.DADAL.002.1","BM6U5LA","D62W3LA"]) {
 const product=notebooks.find(p=>p.sku===sku);
 const image=product?.imageUrl || "";
 const hostname=image?new URL(image).hostname:"none";
 if (image) {
   try {
     const response=await fetch(image,{redirect:"manual",signal:AbortSignal.timeout(5000),headers:{Accept:"image/*"}});
     let locationHost=null;
     try { if(response.headers.get("location")) locationHost=new URL(response.headers.get("location")!,image).hostname; }catch{}
     console.log(JSON.stringify({sku,firstStatus:response.status,locationHost,
       upstreamContentType:response.headers.get("content-type")}));
   } catch(e) { console.log(JSON.stringify({sku,directError:String(e)})); }
 }
 const response=await proxyNotebookImage(sku,notebooks);
 const contentType=response.headers.get("content-type")??"not an image";
 console.log(JSON.stringify({sku,imageHostname:hostname,status:response.status,contentType}));
}
