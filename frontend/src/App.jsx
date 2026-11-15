import { useEffect, useState } from "react";
import CatalogFilters from "./CatalogFilters.jsx";
import FeaturesPanel from "./FeaturesPanel.jsx";
import DealsCarousel from "./DealsCarousel.jsx";
import { translate } from "./i18n.js";
import { filterComputers, getFilterOptions } from "./catalogFilters.js";
import { getPriceComparison } from "./priceComparison.js";

const money = (value) => "$" + Number(value).toLocaleString("es-CL");
const THEME_KEY = "pc-tracker-theme";
function initialTheme() {
  try {
    const stored=localStorage.getItem(THEME_KEY);
    if (stored === "dark" || stored === "light") return stored;
  } catch { /* Storage can be disabled. */ }
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}
export function validDeals(products, now=new Date("2026-11-15T12:00:00Z")) {
  return products.flatMap((product) => (product.offers || [])
    .flatMap((offer) => {
      const verifiedLive = Number.isSafeInteger(offer.priceClp) && Number.isSafeInteger(offer.listPriceClp);
      const price=verifiedLive?offer.priceClp:offer.referencePriceClp;
      const normal=verifiedLive?offer.listPriceClp:offer.referenceNormalPriceClp;
      const recentlyPublished=!verifiedLive && offer.referenceObservedOn &&
        Math.abs(now.getTime()-Date.parse(offer.referenceObservedOn+"T12:00:00Z"))<=7*86400000;
      if(!Number.isSafeInteger(price)||!Number.isSafeInteger(normal)||normal<=price ||
        (normal-price)/normal<0.20||offer.availability==="out_of_stock"||
        !product.imageUrl||(!verifiedLive&&!recentlyPublished)) return [];
      return [{product,offer,discount:Math.round(100*(normal-price)/normal),
        priceClp:price,listPriceClp:normal,isReference:!verifiedLive}];
    }))
    .sort((a,b)=>b.discount-a.discount);
}
function ProductCard({ product, index, t, onHistory, locale }) {
  const [expanded, setExpanded] = useState(false);
  const comparison = getPriceComparison(product.offers || []);
  const verified = comparison.offers.filter((offer) => offer.priceClp !== null).length;
  const referencePrices = comparison.offers.filter((offer) => Number.isSafeInteger(offer.referencePriceClp));
  const referenceMin = referencePrices.length ? Math.min(...referencePrices.map((offer) => offer.referencePriceClp)) : null;
  const shownPrice = comparison.lowestPrice ?? referenceMin;
  return (
    <article className="computer-card">
      <div className="computer-visual product-photo">
        <span className="model-index">{String(index + 1).padStart(2, "0")} / NOTEBOOK</span>
        {product.imageUrl
          ? <img src={product.imageUrl} alt={product.name} loading="lazy" referrerPolicy="no-referrer"/>
          : <div className="photo-unavailable"><span aria-hidden="true">▣</span><p>{t("Imagen aún no disponible")}</p></div>}
      </div>
      <div className="computer-details">
        <p className="card-eyebrow">{product.sku}</p>
        <h3>{product.name.replace(/\s*\([^)]*\)/g,"")}</h3>
        <p className="price">{shownPrice===null ? t("Precio no verificado") : money(shownPrice)}
          {comparison.lowestPrice!==null && <span>{t("Precio observado · CLP")}</span>}
          {comparison.lowestPrice===null && referenceMin!==null &&
            <span>{t("Precio publicado de referencia · confirmar vigencia")}</span>}
          <small className="price-coverage">{verified} {locale==="es"?"de":"of"} {comparison.offers.length} {t("precios verificados")}</small>
        </p>
        <dl className="specification-list">
          <div><dt>RAM</dt><dd>{product.ramGb} GB</dd></div>
          <div><dt>GPU</dt><dd>{product.gpu}</dd></div>
          <div><dt>{t("Procesador")}</dt><dd>{product.processor}</dd></div>
        </dl>
        <div className="price-comparison">
          <button type="button" className="compare-button" aria-expanded={expanded}
            aria-controls={"offers-"+product.id} onClick={() => setExpanded(!expanded)}>
            {expanded?t("Ocultar comparación"):t("Comparar tiendas")+" ("+comparison.offers.length+")"}
          </button>
          {expanded && <div id={"offers-"+product.id} className="comparison-content">
            {verified>=2 && <p className="comparison-summary">{t("Diferencia entre precios verificados")}: <strong>{money(comparison.potentialSavings)}</strong></p>}
            {verified<2 && <p className="comparison-summary">{t("No hay suficientes precios verificables para calcular la diferencia.")}</p>}
            {comparison.offers.length===0 && <p className="feature-note">{t("Todavía no se detectaron tiendas para este modelo.")} {product.profileUrl &&
              <a href={product.profileUrl} target="_blank" rel="noopener noreferrer">{t("Consultar ficha del modelo")}</a>}</p>}
            <ul className="offer-list">{comparison.offers.map((offer) => <li key={offer.sourceId} className="offer-row">
              <span className="offer-source"><a className="retailer-link" href={offer.url} target="_blank" rel="noopener noreferrer">{offer.sourceName}</a></span>
              <strong className="offer-price">{offer.priceClp!==null?money(offer.priceClp):offer.referencePriceClp!=null
                ? money(offer.referencePriceClp)+" ("+t("referencia")+")":t("No verificado")}</strong>
              <span className="offer-extra">{offer.availability==="in_stock" ? t("Stock publicado: disponible") :
                offer.availability==="out_of_stock" ? t("Stock publicado: agotado") :
                offer.availability==="preorder" ? t("Stock publicado: reserva") : t("Stock sin verificar")}</span>
              {offer.discountPercent>=20 && offer.listPriceClp>offer.priceClp &&
                <span className="retailer-discount">-{offer.discountPercent}% · <s>{money(offer.listPriceClp)}</s></span>}
              {offer.referenceDiscountPercent>=20 && offer.priceClp===null &&
                <span className="retailer-discount">-{offer.referenceDiscountPercent}% · {t("descuento publicado de referencia")}</span>}
              {offer.paymentCondition && offer.priceClp===null &&
                <span className="offer-extra">{offer.paymentCondition}</span>}
              {offer.checkedAt && <time className="checked-at" dateTime={offer.checkedAt}>
                {t("Consulta:")} {new Date(offer.checkedAt).toLocaleString(locale==="en"?"en-US":"es-CL")}
              </time>}
            </li>)}</ul>
            <p className="demo-sources-note">{t("Los valores de referencia provienen de publicaciones comerciales; pueden estar desactualizados y nunca se cuentan como precios verificados.")}</p>
          </div>}
        </div>
        <button type="button" className="history-button" onClick={() => onHistory(product.sku)}>
          {t("Ver historial de este notebook")}
        </button>
      </div>
    </article>
  );
}
export default function App() {
  const [theme,setTheme]=useState(initialTheme);
  const [locale,setLocale]=useState(() => {
    try { return localStorage.getItem("pc-tracker-locale")==="en"?"en":"es"; }catch{return "es";}
  });
  const t = (key) => translate(key,locale);
  const [auth,setAuth]=useState(null);
  const [notebooks,setNotebooks]=useState([]);
  const [status,setStatus]=useState("loading");
  const [filters,setFilters]=useState({search:"",minRam:"",gpu:"",processor:""});
  const [selectedSku,setSelectedSku]=useState("");
  const visible = filterComputers(notebooks,filters);
  const options = getFilterOptions(notebooks);
  const selected = notebooks.find((product) => product.sku===selectedSku) || notebooks[0] || null;
  const deals=validDeals(notebooks,new Date());

  useEffect(() => {
    document.documentElement.dataset.theme=theme;
    try{localStorage.setItem(THEME_KEY,theme);}catch{}
  },[theme]);
  useEffect(() => {
    document.documentElement.lang=locale;
    try{localStorage.setItem("pc-tracker-locale",locale);}catch{}
  },[locale]);
  useEffect(() => {
    const controller=new AbortController();
    fetch("/api/auth/me",{signal:controller.signal})
      .then((r)=>r.ok?r.json():null)
      .then((value)=>{if(!controller.signal.aborted)setAuth(value);}).catch(()=>{});
    return()=>controller.abort();
  },[]);
  useEffect(() => {
    const controller=new AbortController();
    fetch("/api/notebooks",{signal:controller.signal})
      .then((r)=>{if(!r.ok)throw Error("Catalog unavailable");return r.json();})
      .then((data)=>{
        if(!Array.isArray(data) || data.some((p)=>!p.sku||!p.name||!p.isLive))throw Error("Invalid catalog");
        if(!controller.signal.aborted){setNotebooks(data);setStatus("ready");}
      }).catch(()=>{if(!controller.signal.aborted)setStatus("error");});
    return()=>controller.abort();
  },[]);
  async function logout() {
    try{const response=await fetch("/api/auth/logout",{method:"POST"});
      if(response.ok)setAuth((old)=>old?{...old,user:null}:null);}
    catch{}
  }
  const chooseHistory=(sku)=>{
    setSelectedSku(sku);
    requestAnimationFrame(()=>document.getElementById("price-history-section")?.scrollIntoView({behavior:"smooth"}));
  };
  return <div className="app-shell">
    <header className="site-header"><div className="container header-inner">
      <a href="#inicio" className="brand" aria-label="PC Tracker, ir al inicio">
        <span className="brand-icon" aria-hidden="true"><span/><span/></span>
        PC <span>Tracker</span><span className="brand-dot">.</span>
      </a>
      <div className="header-actions">
        <button type="button" className="locale-toggle" aria-label={locale==="es"?"Switch to English":"Cambiar a español"}
          onClick={()=>setLocale((v)=>v==="es"?"en":"es")}>{locale==="es"?"EN":"ES"}</button>
        {auth?.enabled && (auth.user
          ? <button className="auth-button" type="button" onClick={logout}>{t("Cerrar sesión")}</button>
          : <a className="auth-button" href={auth.loginUrl||"/api/auth/login"}>{t("Iniciar sesión")}</a>)}
        <button type="button" className="theme-toggle" aria-label={theme==="dark"?t("Activar modo claro"):t("Activar modo oscuro")}
          aria-pressed={theme==="dark"} onClick={()=>setTheme((v)=>v==="dark"?"light":"dark")}>
          <span className="theme-toggle-icon" aria-hidden="true">{theme==="dark"?"☀":"☾"}</span>
          <span className="theme-toggle-label">{theme==="dark"?t("Modo claro"):t("Modo oscuro")}</span>
        </button>
      </div>
    </div></header>
    <main id="inicio">
      <section className="hero container" aria-labelledby="hero-title">
        <div className="hero-content">
          <div className="hero-label"><span className="live-dot"/>{t("ELIGE CON MÁS INFORMACIÓN")}</div>
          <h1 id="hero-title">{t("Tu próximo computador,")} <em>{t("más claro.")}</em></h1>
          <p className="hero-description">{t("Filtra computadores por RAM, GPU y procesador y compara precios y stock cuando cada tienda publique esos datos.")}</p>
          <div className="hero-chips" aria-label={t("Criterios de comparación")}>
            <span><b>01</b><small>RAM</small></span><span><b>02</b><small>GPU</small></span>
            <span><b>03</b><small>{t("PROCESADOR")}</small></span>
          </div>
        </div>
        <DealsCarousel deals={deals} loading={status==="loading"} t={t} locale={locale}/>
      </section>
      <section className="catalog-section" aria-labelledby="catalog-title">
        <div className="container">
          <div className="section-heading"><div>
            <p className="section-kicker">{t("EXPLORA / CATÁLOGO")}</p>
            <h2 id="catalog-title">{t("Notebooks disponibles para comparar")}</h2>
            <p className="section-subtitle">{t("Compara especificaciones y ofertas publicadas. Los precios y el stock se verifican por tienda.")}</p>
          </div>{status==="ready" && <span className="result-count" aria-live="polite">{visible.length} / {notebooks.length}</span>}</div>
          {status==="ready" && notebooks.length>0 && <CatalogFilters filters={filters} options={options}
            t={t} onChange={(key,value)=>setFilters((old)=>({...old,[key]:value}))}
            onClear={()=>setFilters({search:"",minRam:"",gpu:"",processor:""})}/>}
          {status==="loading" && <div className="state-panel" role="status">{t("Cargando notebooks reales…")}</div>}
          {status==="error" && <div className="state-panel error-panel" role="alert">{t("No se pudo conectar con el catálogo de notebooks.")}</div>}
          {status==="ready" && notebooks.length===0 && <div className="state-panel">{t("No hay notebooks verificados disponibles.")}</div>}
          {status==="ready" && notebooks.length>0 && visible.length===0 &&
            <div className="state-panel no-results"><p>{t("No encontramos computadores con esos filtros.")}</p>
              <button type="button" className="clear-filters"
                onClick={()=>setFilters({search:"",minRam:"",gpu:"",processor:""})}>{t("Limpiar filtros")}</button>
            </div>}
          {status==="ready" && visible.length>0 && <div className="computer-grid">
            {visible.map((product,index)=><ProductCard key={product.sku} product={product} index={index}
              t={t} locale={locale} onHistory={chooseHistory}/>)}
          </div>}
        </div>
      </section>
      {selected && <div id="price-history-section">
        <div className="container feature-product-picker">
          <label htmlFor="feature-product">{t("Historial y tiendas para")}:</label>
          <select id="feature-product" value={selected.sku} onChange={(e)=>setSelectedSku(e.target.value)}>
            {notebooks.map((n)=><option key={n.sku} value={n.sku}>{n.name}</option>)}
          </select>
        </div>
        <FeaturesPanel liveComputer={selected} t={t} locale={locale}/>
      </div>}
    </main>
    <footer className="site-footer"><div className="container footer-inner"><span>PC Tracker © 2026</span><span>{t("Diseño de Software · Proyecto 4B")}</span></div></footer>
  </div>;
}
