import { formatMoney } from "./i18n.js";
import { useEffect, useState } from "react";
import NotebookImage from "./NotebookImage.jsx";
export default function DealsCarousel({deals,loading,t,locale}) {
  const money = value => formatMoney(value,locale);
  const [index,setIndex]=useState(0);
  useEffect(()=>{setIndex(0);},[deals.length]);
  useEffect(()=>{
    if(deals.length<2 || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches)return;
    const timer=setInterval(()=>setIndex((current)=>(current+1)%deals.length),5500);
    return()=>clearInterval(timer);
  },[deals.length]);
  const deal=deals[index%Math.max(1,deals.length)];
  return <div className="deals-carousel" aria-roledescription={t("labels.carousel")} aria-label={t("labels.featuredDeals")}>
    {deal ? <div className="deal-content" key={deal.product.sku+deal.offer.sourceId}>
      <div className="deal-top"><span className="deal-badge">-{deal.discount}%</span>
        <span>{deal.isReference?t("labels.publishedDealCurrentValidityNotConfirmed"):t("labels.publishedOffer")}</span></div>
      <NotebookImage product={deal.product} className="deal-product-image" loading="eager"/>
      <h2>{deal.product.name}</h2>
      <p className="deal-source">{deal.offer.sourceName}</p>
      <div className="deal-prices"><strong>{money(deal.priceClp)}</strong><s>{money(deal.listPriceClp)}</s></div>
      <a href={deal.offer.url} target="_blank" rel="noopener noreferrer" className="deal-link">
        {t("labels.viewStoreOffer")}
      </a>
    </div> : <div className="deal-empty">
      <span className="deal-empty-icon" aria-hidden="true">%</span>
      <h2>{loading?t("labels.lookingForDeals"):t("labels.noVerifiedDiscountsOf20OrMore")}</h2>
      <p>{t("labels.onlyRetailerPublishedMarkdownsAppearHereNeverPrice")}</p>
    </div>}
    {deals.length>1 && <div className="deal-controls">
      <button type="button" onClick={()=>setIndex((v)=>(v-1+deals.length)%deals.length)}
        aria-label={t("labels.previousDeal")}>‹</button>
      <span>{index+1} / {deals.length}</span>
      <button type="button" onClick={()=>setIndex((v)=>(v+1)%deals.length)}
        aria-label={t("labels.nextDeal")}>›</button>
    </div>}
  </div>;
}
