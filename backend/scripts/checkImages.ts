import {getNotebooks} from "../notebooks.ts";
import {proxyNotebookImage} from "../images.ts";
const notebooks=await getNotebooks();
for(const sku of ["83JC0080CL","DB9V5AT#ABM"]) {
 const product=notebooks.find(p=>p.sku===sku);
 const image=product?.imageUrl || "";
 const hostname=image?new URL(image).hostname:"none";
 const response=await proxyNotebookImage(sku,notebooks);
 const contentType=response.headers.get("content-type")??"not an image";
 console.log(JSON.stringify({sku,imageHostname:hostname,status:response.status,contentType}));
}
