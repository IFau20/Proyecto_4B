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

export function nearestSixStores(stores,position) {
  return (stores||[])
    .filter(store=>Number.isFinite(store.lat)&&Number.isFinite(store.lon)&&
      typeof store.address==="string"&&store.address.length>0)
    .map(store=>({...store,distance:kilometersBetween(position,store)}))
    .sort((a,b)=>a.distance-b.distance||a.name.localeCompare(b.name))
    .slice(0,6);
}
function StoreLocator({offers,t,locale}) {
  const [userPosition,setUserPosition]=useState(null);
  const [nearby,setNearby]=useState([]);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
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
        setNearby(nearestSixStores(Array.isArray(stores)?stores:[],coordinates));
        setError("");
      }catch{
        setError(t("No se pudo consultar la ubicación de las tiendas."));
        setNearby([]);
      }finally{setLoading(false);}
    },()=>{
      setLoading(false);
      setUserPosition(null);
      setNearby([]);
      setError(t("No se pudo obtener tu ubicación. Revisa el permiso del navegador."));
    },{enableHighAccuracy:false,timeout:12000,maximumAge:60000});
  };
  const days={es:["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"],
    en:["Sun","Mon","Tue","Wed","Thu","Fri","Sat"]};
  const openingText=store=>{
    const periods=Object.entries(store.weekly||{}).sort(([a],[b])=>Number(a)-Number(b));
    if(!periods.length)return t("Horario disponible en el sitio oficial.");
    return periods.map(([day,times])=>days[locale][Number(day)]+" "+
      (times.length===4?times[0]+"–"+times[1]+" / "+times[2]+"–"+times[3]:times.join("–")))
      .join(" · ");
  };
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
      <p className="feature-note">{t("Las seis sucursales más cercanas con dirección y coordenadas verificables. Distancia aproximada en línea recta.")}</p>
      {nearby.length<6&&<p className="feature-note">
        {t("Se encontraron menos de seis sucursales con coordenadas disponibles.")} ({nearby.length})
      </p>}
      <div className="store-grid">
        {nearby.map((store,i)=><article className="store-card" key={store.sourceId}>
          <div className="store-title">
            <h3>{i+1}. {store.name}</h3><strong>{store.distance.toFixed(1)} km</strong>
          </div>
          <p>{store.address}</p>
          <p className="store-times">{openingText(store)}</p>
          <p className="feature-footnote">{hasProductListing(store)
            ?t("Tienda asociada al modelo; stock físico de esta sucursal sin confirmar.")
            :t("Disponibilidad del notebook en esta sucursal sin confirmar.")}</p>
          <div className="store-links">
            <a href={store.contactUrl} target="_blank" rel="noopener noreferrer">{t("Información oficial")}</a>
            <a href={"https://www.google.com/maps/search/?api=1&query="+encodeURIComponent(store.address)}
              target="_blank" rel="noopener noreferrer">{t("Ver en mapa")}</a>
          </div>
        </article>)}
      </div>
    </div>}
  </section>;

export default function FeaturesPanel({ liveComputer, t, locale }) {
  if (!liveComputer) return null;
  return (
    <div className="extra-features container">
      <PriceHistory sku={liveComputer.sku} t={t} locale={locale}/>
      <StoreLocator offers={liveComputer.offers} t={t} locale={locale}/>
    </div>
  );
}
