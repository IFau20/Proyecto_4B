import { formatNumber } from "./i18n.js";
import { useEffect, useMemo, useState } from "react";
import PriceHistoryChart from "./PriceHistoryChart.jsx";

const EARTH_RADIUS_KM = 6371;
export function kilometersBetween(a, b) {
  const radians = (degrees) => degrees * Math.PI / 180;
  const deltaLat = radians(b.lat - a.lat);
  const deltaLon = radians(b.lon - a.lon);
  const x = Math.sin(deltaLat / 2) ** 2 +
    Math.cos(radians(a.lat)) * Math.cos(radians(b.lat)) * Math.sin(deltaLon / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.asin(Math.min(1, Math.sqrt(x)));
}
const dateTime = (iso, locale) => new Date(iso).toLocaleString(locale === "en" ? "en-US" : "es-CL");
const labelStatus = (status, t) => ({
  in_stock: t("labels.inStockOnline"), out_of_stock: t("labels.soldOut"),
  preorder: t("labels.preorder"), unknown: t("labels.unverifiedAlternative"),
})[status || "unknown"];

function PriceHistory({sku,t,locale}) {
  const [history,setHistory]=useState(null);
  const [error,setError]=useState(false);
  useEffect(()=>{
    if(!sku)return;
    setHistory(null);setError(false);
    const controller=new AbortController();
    fetch("/api/history?sku="+encodeURIComponent(sku),{signal:controller.signal})
      .then(r=>{if(!r.ok)throw Error("History unavailable");return r.json();})
      .then(data=>{if(!controller.signal.aborted)setHistory(data);})
      .catch(()=>{if(!controller.signal.aborted)setError(true);});
    return()=>controller.abort();
  },[sku]);
  return <section className="feature-panel" aria-labelledby="history-heading">
    <div className="feature-heading"><div>
      <p className="feature-eyebrow">{t("labels.priceTracking")}</p>
      <h2 id="history-heading">{t("labels.priceHistory")}</h2>
    </div></div>
    {error&&<p role="alert" className="feature-note">{t("labels.couldNotLoadPriceHistory")}</p>}
    {!error&&!history&&<p className="feature-note">{t("labels.loadingPriceHistory")}</p>}
    {history&&<PriceHistoryChart key={sku} history={history} t={t} locale={locale}/>}
    {history?.archived&&<p className="feature-note">{t("labels.lastAvailableHistoricalObservationThisIsNotA")}</p>}
    {history && <p className="feature-footnote">{history.source==="solotodo_public"
      ? t("labels.publicSolotodoHistoryPricesAndDatesAttributedTo")
      : t("labels.pcTrackerHistoryIsBuiltFromActualRecorded")}</p>}
  </section>;
}

export function nearestSixStores(stores,position,records=null) {
  return (stores||[])
    .filter(store=>records===null||branchStatus(store,records)==="in_stock")
    .filter(store=>Number.isFinite(store.lat)&&Number.isFinite(store.lon)&&
      typeof store.address==="string"&&store.address.length>0)
    .map(store=>({...store,distance:kilometersBetween(position,store)}))
    .sort((a,b)=>a.distance-b.distance||a.name.localeCompare(b.name))
    .slice(0,6);
}
export function branchStatus(store,records) {
  return records.find(r=>r.sourceId===store.sourceId)?.status??"unknown";
}
export function hoursOnDate(store,date) {
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date))return null;
  return store.weekly?.[new Date(date+"T12:00:00").getDay()]??null;
}
const localToday=()=>{const n=new Date();return new Date(n.getTime()-n.getTimezoneOffset()*60000).toISOString().slice(0,10);};
function StoreLocator({offers,sku,t,locale}) {
  const [userPosition,setUserPosition]=useState(null);
  const [stores,setStores]=useState([]);
  const [confirmedOnly,setConfirmedOnly]=useState(true);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  const [date,setDate]=useState(localToday);
  const [holiday,setHoliday]=useState(null);
  const [holidayUnknown,setHolidayUnknown]=useState(false);
  const [stockSnapshot,setStockSnapshot]=useState(null);
  const stock=stockSnapshot?.sku===sku?stockSnapshot.records:[];
  const [stockLoading,setStockLoading]=useState(false);
  const [stockError,setStockError]=useState(false);
  const [stockAttempt,setStockAttempt]=useState(0);
  const nearby=useMemo(()=>userPosition?nearestSixStores(stores,userPosition,confirmedOnly?stock:null):[],
    [stores,userPosition,confirmedOnly,stock]);
  useEffect(()=>{
    if(!userPosition||!sku)return;
    const controller=new AbortController();
    setStockSnapshot(null);setStockLoading(true);setStockError(false);
    fetch("/api/branch-stock?sku="+encodeURIComponent(sku),{signal:controller.signal})
      .then(r=>{if(!r.ok)throw Error("Branch stock unavailable");return r.json();})
      .then(data=>{if(data.sku!==sku||!Array.isArray(data.records))throw Error("Invalid branch response");
        if(!controller.signal.aborted)setStockSnapshot({sku,records:data.records});})
      .catch(()=>{if(!controller.signal.aborted){setStockSnapshot(null);setStockError(true);}})
      .finally(()=>{if(!controller.signal.aborted)setStockLoading(false);});
    return()=>controller.abort();
  },[userPosition,sku,stockAttempt]);
  useEffect(()=>{
    if(!userPosition)return;
    const controller=new AbortController();
    setHoliday(null);setHolidayUnknown(false);
    fetch("/api/holidays?date="+encodeURIComponent(date),{signal:controller.signal})
      .then(r=>r.ok?r.json():{status:"calendar_unavailable"})
      .then(data=>{if(!controller.signal.aborted){setHoliday(data.holiday??null);setHolidayUnknown(data.status==="calendar_unavailable");}})
      .catch(()=>{if(!controller.signal.aborted)setHolidayUnknown(true);});
    return()=>controller.abort();
  },[userPosition,date]);
  const locate=()=>{
    if(!navigator.geolocation){setError("labels.geolocationUnavailable");return;}
    setError("");setLoading(true);
    navigator.geolocation.getCurrentPosition(async position=>{
      const coordinates={lat:position.coords.latitude,lon:position.coords.longitude};
      setUserPosition(coordinates);
      try{
        // Only published store addresses are sent to the geocoding service.
        // The visitor's coordinates never leave the browser.
        const response=await fetch("/api/stores?nearby=1");
        if(!response.ok)throw Error("Stores unavailable");
        const stores=await response.json();
        setStores(Array.isArray(stores)?stores:[]);
        setError("");
      }catch{
        setError("labels.couldNotLoadStoreLocations");
        setStores([]);
      }finally{setLoading(false);}
    },()=>{
      setLoading(false);
      setUserPosition(null);
      setStores([]);
      setError("labels.couldNotGetYourLocationCheckYourBrowser");
    },{enableHighAccuracy:false,timeout:12000,maximumAge:60000});
  };
  const openingText=store=>{
    if(store.closedUntilNotice)return t("labels.closedUntilFurtherNoticeAccordingToTheRetailer");
    if(!store.scheduleVerified)return t("labels.regularOpeningHoursUnverified");
    const slots=hoursOnDate(store,date);
    if(!slots?.length)return t("labels.noVerifiedHoursForThisDate");
    const day=new Date(date+"T12:00:00").getDay();
    const ranges=slots.length===4?slots[0]+"–"+slots[1]+" / "+slots[2]+"–"+slots[3]:slots.join("–");
    return t("stores.opening",{day:t("weekdays."+["sun","mon","tue","wed","thu","fri","sat"][day]),ranges});
  };
  const pcFactoryProduct=(offers||[]).find(offer=>
    /pc\s*factory/i.test(offer.sourceName||"") &&
    /^https:\/\/(www\.)?pcfactory\.cl\/producto\//i.test(offer.url||""));
  const hasProductListing=(store)=>Boolean(offers?.some(offer=>offer.sourceId===store.sourceId||
    (store.sourceId.startsWith("pcfactory-")&&/pc\s*factory/i.test(offer.sourceName||""))));
  return <section className={"feature-panel location-panel"+(userPosition?" location-panel-expanded":"")}
    aria-labelledby="stores-heading">
    <div className="feature-heading">
      <div>
        <p className="feature-eyebrow">{t("labels.locationsAndOpeningHours")}</p>
        <h2 id="stores-heading">{t("labels.storesAndPickupPoints")}</h2>
      </div>
      <button type="button" className="feature-button" onClick={locate} disabled={loading}
        aria-expanded={Boolean(userPosition&&!loading)}>
        {loading?t("labels.findingTheClosestStores"):t("labels.findNearby")}
      </button>
    </div>
    {error&&<p role="alert" className="feature-note">{t(error)}</p>}
    {loading&&<p role="status" className="feature-note">{t("labels.checkingGeocodableStoreAddresses")}</p>}
    {userPosition&&!loading&&<div className="nearby-results">
      <label className="nearby-date-label">{t("labels.dateToCheck")}
        <input type="date" value={date} min="2025-01-01" max="2030-12-31"
          onChange={e=>setDate(e.target.value)}/>
      </label>
      {holiday&&<p className="feature-note holiday-warning" role="status">
        {t("labels.chileanHoliday")}: {holiday.name}{holiday.irrenunciable?" · "+t("labels.mandatoryHoliday"):""}.
        {" "+t("labels.confirmSpecialHolidayHoursWithTheStore")}
      </p>}
      {holidayUnknown&&<p className="feature-note">{t("labels.couldNotVerifyTheHolidayCalendar")}</p>}
      <p className="feature-footnote">{t("labels.stockReflectsTheCurrentCheckTheSelectedDate")}</p>
      <label className="nearby-stock-filter"><input type="checkbox" checked={confirmedOnly}
        onChange={e=>setConfirmedOnly(e.target.checked)}/> {t("labels.onlyBranchesWithConfirmedStock")}</label>
      <p className="feature-note">{t("labels.branchesAreSortedByDistanceAfterFilteringStock")}</p>
      {stockLoading?<p role="status" className="feature-note">{t("labels.checkingBranchInventory")}</p>:stockError?
        <div><p role="alert" className="feature-note">{t("labels.branchInventoryCouldNotBeChecked")}</p>
          <button type="button" className="feature-button" onClick={()=>setStockAttempt(v=>v+1)}>{t("labels.retryInventory")}</button></div>:
        <p className="feature-note" aria-live="polite">
          {t("stores.confirmedCount",{confirmed:nearby.filter(store=>branchStatus(store,stock)==="in_stock").length,total:nearby.length})}
          {" "+t("labels.unverifiedDoesNotMeanSoldOut")}
        </p>}
      <div className="store-grid">
        {nearby.map((store,i)=>{
          const record=stock.find(x=>x.sourceId===store.sourceId);
          const state=branchStatus(store,stock);
          return <article className="store-card" key={store.sourceId}>
            <div className="store-title"><h3>{i+1}. {store.name}</h3><strong>{t("stores.distance",{distance:formatNumber(store.distance,locale,{minimumFractionDigits:1,maximumFractionDigits:1})})}</strong></div>
            <p>{store.address}</p>
            <p className="store-stock-status" data-stock={state}>
              {state==="in_stock"?t("labels.inStoreInventoryConfirmed")+(record?.quantity!=null?" · "+record.quantity+" "+t("labels.units")+(record.approximate?" ("+t("labels.approximate")+")":""):""):
                state==="out_of_stock"?t("labels.outOfStockAtThisBranch"):t("labels.branchInventoryUnverified")}
            </p>
            <p className="store-times">{openingText(store)}</p>
            {store.scheduleNotice&&<p className="feature-footnote">{t("labels.noticePublishedByTheRetailer")}: {store.scheduleNotice}</p>}
            {record?.closedAtCheck&&<p className="feature-footnote">{t("labels.theStoreReportsItIsClosedAtThe")}</p>}
            {holiday&&<p className="feature-footnote">{t("labels.holidayHoursUnverified")}</p>}
            {record&&<p className="feature-footnote">{t("labels.checked")}: {new Date(record.checkedAt).toLocaleString(locale==="en"?"en-US":"es-CL")}</p>}
            <div className="store-links">
              <a href={store.contactUrl} target="_blank" rel="noopener noreferrer">{t("labels.officialInformation")}</a>
              {store.sourceId.startsWith("pcfactory-")&&pcFactoryProduct &&
                <a href={pcFactoryProduct.url} target="_blank" rel="noopener noreferrer">
                  {t("labels.checkNotebookStockOnPcFactory")}
                </a>}
              <a href={"https://www.google.com/maps/search/?api=1&query="+encodeURIComponent(store.address)}
                target="_blank" rel="noopener noreferrer">{t("labels.viewMap")}</a>
            </div>
          </article>;
        })}
      </div>
      {!stockLoading&&!stockError&&confirmedOnly&&nearby.length===0&&<p className="feature-note" role="status">{t("labels.noBranchesWithConfirmedStockWereFoundFor")}</p>}
    </div>}
  </section>;
}

export default function FeaturesPanel({ liveComputer, t, locale }) {
  if (!liveComputer) return null;
  return (
    <div className="extra-features container">
      <PriceHistory sku={liveComputer.sku} t={t} locale={locale}/>
      <StoreLocator offers={liveComputer.offers} sku={liveComputer.sku} t={t} locale={locale}/>
    </div>
  );
}
