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

function PriceHistory({sku,profileUrl,t,locale}) {
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
    {history&&<PriceHistoryChart key={sku} history={history} profileUrl={profileUrl} t={t} locale={locale}/>}
    <p className="feature-footnote">{t("No se inventan precios anteriores: únicamente se registran precios obtenidos en consultas reales.")}</p>
  </section>;
}

function StoreLocator({ offers, t, locale }) {
  const [stores, setStores] = useState(null);
  const [failed, setFailed] = useState(false);
  const [userPosition, setUserPosition] = useState(null);
  const [geoError, setGeoError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/stores", { signal: controller.signal })
      .then((response) => { if (!response.ok) throw Error("Failed"); return response.json(); })
      .then((data) => { if (!controller.signal.aborted) setStores(Array.isArray(data) ? data : []); })
      .catch(() => { if (!controller.signal.aborted) setFailed(true); });
    return () => controller.abort();
  }, []);
  const sorted = useMemo(() => (stores || []).map((store) => ({
    ...store,
    distance: userPosition && Number.isFinite(store.lat) && Number.isFinite(store.lon)
      ? kilometersBetween(userPosition, store) : null,
  })).sort((a, b) => (a.distance ?? 99999) - (b.distance ?? 99999)), [stores, userPosition]);
  const locate = () => {
    if (!navigator.geolocation) { setGeoError(t("Geolocalización no disponible.")); return; }
    navigator.geolocation.getCurrentPosition(
      (position) => { setUserPosition({lat: position.coords.latitude, lon: position.coords.longitude}); setGeoError(""); },
      () => setGeoError(t("No se pudo obtener tu ubicación. Puedes consultar las direcciones manualmente.")),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
    );
  };
  const availability = (id) => offers?.find((offer) => offer.sourceId === id)?.availability || "unknown";
  const openingText = (store) => {
    const entries = Object.entries(store.weekly || {}).sort(([a],[b])=>Number(a)-Number(b));
    return entries.map(([day, times]) => DAY_NAMES[locale][Number(day)] + " " +
      (times.length === 4 ? times[0] + "–" + times[1] + " / " + times[2] + "–" + times[3]
        : times.join("–"))).join(" · ");
  };

  return (
    <section className="feature-panel" aria-labelledby="stores-heading">
      <div className="feature-heading">
        <div>
          <p className="feature-eyebrow">{t("UBICACIÓN Y HORARIOS")}</p>
          <h2 id="stores-heading">{t("Tiendas y puntos de retiro")}</h2>
        </div>
        <button type="button" className="feature-button" onClick={locate}>{t("Buscar cerca de mí")}</button>
      </div>
      {geoError && <p role="alert" className="feature-note">{geoError}</p>}
      {userPosition && <p className="feature-note">{t("Distancias aproximadas en línea recta; nunca se almacena tu ubicación.")}</p>}
      {failed && <p className="feature-note">{t("No se pudo cargar la información de las tiendas.")}</p>}
      {!failed && !stores && <p className="feature-note">{t("Consultando horarios de tiendas…")}</p>}
      {stores && <div className="store-grid">
        {sorted.map((store) =>
          <article className="store-card" key={store.sourceId}>
            <div className="store-title">
              <h3>{store.name}</h3>
              <strong>{labelStatus(availability(store.sourceId), t)}</strong>
            </div>
            <p>{store.address}</p>
            {store.distance !== null && <p><strong>{store.distance.toFixed(1)} km</strong> {t("aproximadamente")}</p>}
            <p className="store-times">{openingText(store)}</p>
            <p className="feature-footnote">{store.scheduleVerified
              ? t("Horario publicado comprobado en la web de la tienda.")
              : t("Horario de referencia: no verificado en esta consulta.")}</p>
            <p className="feature-footnote">{t("No confirma stock para retiro en esta sucursal ni apertura en feriados.")}</p>
            <div className="store-links">
              <a href={store.contactUrl} target="_blank" rel="noopener noreferrer">{t("Horario oficial")}</a>
              <a href={"https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(store.address)}
                target="_blank" rel="noopener noreferrer">{t("Ver en mapa")}</a>
            </div>
          </article>)}
      </div>}
    </section>
  );
}

export default function FeaturesPanel({ liveComputer, t, locale }) {
  if (!liveComputer) return null;
  return (
    <div className="extra-features container">
      <PriceHistory sku={liveComputer.sku} profileUrl={liveComputer.profileUrl} t={t} locale={locale}/>
      <StoreLocator offers={liveComputer.offers} t={t} locale={locale}/>
    </div>
  );
}
