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
const money = (price) => "$" + Number(price).toLocaleString("es-CL");
const dateTime = (iso, locale) => new Date(iso).toLocaleString(locale === "en" ? "en-US" : "es-CL");
const DAY_NAMES = {
  es: ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"],
  en: ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],
};
const labelStatus = (status, t) => ({
  in_stock: t("Disponible online"), out_of_stock: t("Agotado"),
  preorder: t("Reserva"), unknown: t("Sin verificar"),
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
      <p className="feature-eyebrow">{t("SEGUIMIENTO DE PRECIOS")}</p>
      <h2 id="history-heading">{t("Historial de precios")}</h2>
    </div></div>
    {error&&<p role="alert" className="feature-note">{t("No se pudo consultar el historial.")}</p>}
    {!error&&!history&&<p className="feature-note">{t("Cargando historial…")}</p>}
    {history&&<PriceHistoryChart key={sku} history={history} t={t} locale={locale}/>}
    {history && <p className="feature-footnote">{history.source==="solotodo_public"
      ? t("Historial público de SoloTodo: precios y fechas atribuidos a su fuente.")
      : t("Historial propio de PC Tracker; se construye con precios reales registrados.")}</p>}
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
    if(!navigator.geolocation){setError(t("Geolocalización no disponible."));return;}
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
        setError(t("No se pudo consultar la ubicación de las tiendas."));
        setStores([]);
      }finally{setLoading(false);}
    },()=>{
      setLoading(false);
      setUserPosition(null);
      setStores([]);
      setError(t("No se pudo obtener tu ubicación. Revisa el permiso del navegador."));
    },{enableHighAccuracy:false,timeout:12000,maximumAge:60000});
  };
  const days={es:["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"],
    en:["Sun","Mon","Tue","Wed","Thu","Fri","Sat"]};
  const openingText=store=>{
    if(store.closedUntilNotice)return t("Cerrada hasta nuevo aviso según la tienda.");
    if(!store.scheduleVerified)return t("Horario habitual no verificado.");
    const slots=hoursOnDate(store,date);
    if(!slots?.length)return t("No hay horario confirmado para este día.");
    const day=new Date(date+"T12:00:00").getDay();
    const ranges=slots.length===4?slots[0]+"–"+slots[1]+" / "+slots[2]+"–"+slots[3]:slots.join("–");
    return days[locale][day]+" "+ranges+" · "+t("Horario habitual comprobado");
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
        <p className="feature-eyebrow">{t("UBICACIÓN Y HORARIOS")}</p>
        <h2 id="stores-heading">{t("Tiendas y puntos de retiro")}</h2>
      </div>
      <button type="button" className="feature-button" onClick={locate} disabled={loading}
        aria-expanded={Boolean(userPosition&&!loading)}>
        {loading?t("Buscando las tiendas más cercanas…"):t("Buscar cerca de mí")}
      </button>
    </div>
    {error&&<p role="alert" className="feature-note">{error}</p>}
    {loading&&<p role="status" className="feature-note">{t("Consultando ubicaciones verificables…")}</p>}
    {userPosition&&!loading&&<div className="nearby-results">
      <label className="nearby-date-label">{t("Fecha de consulta")}
        <input type="date" value={date} min="2025-01-01" max="2030-12-31"
          onChange={e=>setDate(e.target.value)}/>
      </label>
      {holiday&&<p className="feature-note holiday-warning" role="status">
        {t("Feriado en Chile")}: {holiday.name}{holiday.irrenunciable?" · "+t("Irrenunciable"):""}.
        {" "+t("Confirma el horario especial directamente con la tienda.")}
      </p>}
      {holidayUnknown&&<p className="feature-note">{t("No se pudo verificar el calendario de feriados.")}</p>}
      <p className="feature-footnote">{t("El stock corresponde a la consulta actual; la fecha seleccionada se aplica a los horarios.")}</p>
      <label className="nearby-stock-filter"><input type="checkbox" checked={confirmedOnly}
        onChange={e=>setConfirmedOnly(e.target.checked)}/> {t("Solo sucursales con stock confirmado")}</label>
      <p className="feature-note">{t("Las sucursales se ordenan por distancia después de filtrar el stock del notebook seleccionado.")}</p>
      {stockLoading?<p role="status" className="feature-note">{t("Verificando stock por sucursal…")}</p>:stockError?
        <div><p role="alert" className="feature-note">{t("No se pudo verificar el stock por sucursal.")}</p>
          <button type="button" className="feature-button" onClick={()=>setStockAttempt(v=>v+1)}>{t("Reintentar stock")}</button></div>:
        <p className="feature-note" aria-live="polite">
          {t("Sucursales cercanas con stock confirmado")}: {nearby.filter(store=>branchStatus(store,stock)==="in_stock").length} / {nearby.length}.
          {" "+t("Sin confirmación no significa agotado.")}
        </p>}
      <div className="store-grid">
        {nearby.map((store,i)=>{
          const record=stock.find(x=>x.sourceId===store.sourceId);
          const state=branchStatus(store,stock);
          return <article className="store-card" key={store.sourceId}>
            <div className="store-title"><h3>{i+1}. {store.name}</h3><strong>{store.distance.toFixed(1)} km</strong></div>
            <p>{store.address}</p>
            <p className="store-stock-status" data-stock={state}>
              {state==="in_stock"?t("Stock en sucursal confirmado")+(record?.quantity!=null?" · "+record.quantity+" "+t("unidades")+(record.approximate?" ("+t("aproximado")+")":""):""):
                state==="out_of_stock"?t("Sin stock en sucursal"):t("Stock de sucursal sin verificar")}
            </p>
            <p className="store-times">{openingText(store)}</p>
            {store.scheduleNotice&&<p className="feature-footnote">{t("Aviso publicado por la tienda")}: {store.scheduleNotice}</p>}
            {record?.closedAtCheck&&<p className="feature-footnote">{t("La tienda informa cierre al momento de consultar; confirma el retiro antes de viajar.")}</p>}
            {holiday&&<p className="feature-footnote">{t("Horario de feriado no confirmado.")}</p>}
            {record&&<p className="feature-footnote">{t("Comprobado")}: {new Date(record.checkedAt).toLocaleString(locale==="en"?"en-US":"es-CL")}</p>}
            <div className="store-links">
              <a href={store.contactUrl} target="_blank" rel="noopener noreferrer">{t("Información oficial")}</a>
              {store.sourceId.startsWith("pcfactory-")&&pcFactoryProduct &&
                <a href={pcFactoryProduct.url} target="_blank" rel="noopener noreferrer">
                  {t("Consultar stock del notebook en PC Factory")}
                </a>}
              <a href={"https://www.google.com/maps/search/?api=1&query="+encodeURIComponent(store.address)}
                target="_blank" rel="noopener noreferrer">{t("Ver en mapa")}</a>
            </div>
          </article>;
        })}
      </div>
      {!stockLoading&&!stockError&&confirmedOnly&&nearby.length===0&&<p className="feature-note" role="status">{t("No se encontraron sucursales con stock confirmado para este notebook. Puedes desmarcar el filtro para consultar otras tiendas.")}</p>}
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
