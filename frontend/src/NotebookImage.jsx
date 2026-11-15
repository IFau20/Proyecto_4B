import {useEffect,useState} from "react";
// Prefer the same-origin product image proxy; fall back to the original source URL.
export default function NotebookImage({product,className="",loading="lazy"}) {
 const [stage,setStage]=useState(0);
 useEffect(()=>setStage(0),[product.sku,product.imageUrl]);
 if(stage>0 && (!product.imageUrl || stage>1)) return <div className="photo-unavailable" role="img" aria-label={product.name}>
   <span aria-hidden="true">▣</span>
 </div>;
 const src=stage===0?"/api/notebook-image?sku="+encodeURIComponent(product.sku):product.imageUrl;
 return <img src={src} className={className} alt={product.name}
   loading={loading} onError={()=>setStage(v=>v+1)}/>;
}
