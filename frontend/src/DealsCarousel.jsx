import { useEffect, useState } from "react";
import NotebookImage from "./NotebookImage.jsx";
const money=(n)=>"$"+Number(n).toLocaleString("es-CL");
export default function DealsCarousel({deals,loading,t,locale}) {
  const [index,setIndex]=useState(0);
  useEffect(()=>{setIndex(0);},[deals.length]);
  useEffect(()=>{
    if(deals.length<2 || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches)return;
    const timer=setInterval(()=>setIndex((current)=>(current+1)%deals.length),5500);
    return()=>clearInterval(timer);
  },[deals.length]);
  const deal=deals[index%Math.max(1,deals.length)];
  return <div className="deals-carousel" aria-roledescription={t("carrusel")} aria-label={t("Ofertas destacadas")}>
    {deal ? <div className="deal-content" key={deal.product.sku+deal.offer.sourceId}>
      <div className="deal-top"><span className="deal-badge">-{deal.discount}%</span>
        <span>{deal.isReference?t("Oferta publicada · vigencia por confirmar"):t("Oferta publicada")}</span></div>
      <NotebookImage product={deal.product} className="deal-product-image" loading="eager"/>
      <h2>{deal.product.name}</h2>
      <p className="deal-source">{deal.offer.sourceName}</p>
      <div className="deal-prices"><strong>{money(deal.priceClp)}</strong><s>{money(deal.listPriceClp)}</s></div>
      <a href={deal.offer.url} target="_blank" rel="noopener noreferrer" className="deal-link">
        {t("Ver oferta en tienda")}
      </a>
    </div> : <div className="deal-empty">
      <span className="deal-empty-icon" aria-hidden="true">%</span>
      <h2>{loading?t("Buscando ofertas…"):t("Sin descuentos verificados de 20% o más")}</h2>
      <p>{t("El carrusel mostrará únicamente rebajas reales publicadas por una tienda, nunca diferencias entre tiendas.")}</p>
    </div>}
    {deals.length>1 && <div className="deal-controls">
      <button type="button" onClick={()=>setIndex((v)=>(v-1+deals.length)%deals.length)}
        aria-label={t("Oferta anterior")}>‹</button>
      <span>{index+1} / {deals.length}</span>
      <button type="button" onClick={()=>setIndex((v)=>(v+1)%deals.length)}
        aria-label={t("Oferta siguiente")}>›</button>
    </div>}
  </div>;
}
