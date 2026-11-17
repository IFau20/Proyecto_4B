import { useEffect, useMemo, useState } from "react";
import CatalogFilters from "./CatalogFilters.jsx";
import FeaturesPanel from "./FeaturesPanel.jsx";
import DealsCarousel from "./DealsCarousel.jsx";
import NotebookImage from "./NotebookImage.jsx";
import { translate, initialLocale, formatMoney } from "./i18n.js";
import { filterComputers, getFilterOptions } from "./catalogFilters.js";
import { getPriceComparison } from "./priceComparison.js";

const THEME_KEY = "pc-tracker-theme";
const CATALOG_SESSION_KEY="pc-tracker-catalog-v2";
const SESSION_TTL_MS=5*60*1000;
function isValidCatalog(data) {
 return Array.isArray(data)&&
   data.every(product=>product&&typeof product.sku==="string"&&
     typeof product.name==="string"&&product.isLive===true);
}
function fromSession() {
 try{
   const cache=JSON.parse(sessionStorage.getItem(CATALOG_SESSION_KEY)||"null");
   if(cache&&Number.isFinite(cache.at)&&Date.now()-cache.at>=0&&
      Date.now()-cache.at<SESSION_TTL_MS&&isValidCatalog(cache.data))return cache.data;
 }catch{/* Storage may be blocked or full. */}
 return [];
}
function saveSession(data) {
 try{sessionStorage.setItem(CATALOG_SESSION_KEY,JSON.stringify({at:Date.now(),data}));}
 catch{/* Storage is optional; network requests still work. */}
}

export const PAGE_SIZE=12;
export function paginateNotebooks(computers,page,pageSize=PAGE_SIZE) {
 const totalPages=Math.max(1,Math.ceil(computers.length/pageSize));
 const actualPage=Math.max(1,Math.min(totalPages,Math.floor(page)||1));
 const first=(actualPage-1)*pageSize;
 return {items:computers.slice(first,first+pageSize),page:actualPage,totalPages,
   first:computers.length?first+1:0,last:Math.min(first+pageSize,computers.length)};
}
function initialTheme() {
  try {
    const stored=localStorage.getItem(THEME_KEY);
    if (stored === "dark" || stored === "light") return stored;
  } catch { /* Storage can be disabled. */ }
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}
export function hasSpecialCondition(offer) {
  return Boolean(String(offer.paymentCondition || "").trim()) && !Number.isSafeInteger(offer.standardPriceClp) ||
    /tarjeta|cencosud|convenio|membres[ií]a|suscripci[oó]n|cup[oó]n|club|precio exclusivo/i
      .test(String(offer.sourceName || "")+" "+String(offer.condition || ""));
}
export function validDeals(products, now=new Date("2026-11-15T12:00:00Z")) {
  return products.flatMap((product) => (product.offers || [])
    .flatMap((offer) => {
      if(hasSpecialCondition(offer))return [];
      const verifiedLive = Number.isSafeInteger(offer.priceClp) && Number.isSafeInteger(offer.listPriceClp);
      const price=verifiedLive?offer.priceClp:offer.referencePriceClp;
      const normal=verifiedLive?offer.listPriceClp:offer.referenceNormalPriceClp;
      const age=now.getTime()-Date.parse((offer.referenceObservedOn||"1900-01-01")+"T00:00:00Z");
      const recentlyPublished=!verifiedLive && offer.referenceObservedOn &&
        Number.isFinite(age) && age>=0 && age<=7*86400000;
      if(!Number.isSafeInteger(price)||!Number.isSafeInteger(normal)||normal<=price ||
        (normal-price)/normal<0.20||offer.availability==="out_of_stock"||
        !product.imageUrl||(!verifiedLive&&!recentlyPublished)) return [];
      return [{product,offer,discount:Math.round(100*(normal-price)/normal),
        priceClp:price,listPriceClp:normal,isReference:!verifiedLive}];
    }))
    .sort((a,b)=>b.discount-a.discount);
}
function ProductCard({ product, t, onHistory, locale }) {
  const money = value => formatMoney(value, locale);
  const [expanded, setExpanded] = useState(false);
  const [verification,setVerification]=useState(null);
  const [checking,setChecking]=useState(false);
  const [checkFailed,setCheckFailed]=useState(false);
  useEffect(()=>{
    if(!expanded)return;
    const controller=new AbortController();
    setChecking(true);setCheckFailed(false);
    fetch("/api/verify-notebook?sku="+encodeURIComponent(product.sku),{signal:controller.signal})
      .then(response=>{if(!response.ok)throw Error("Verification unavailable");return response.json();})
      .then(data=>{
        if(data.sku!==product.sku||!Array.isArray(data.offers))throw Error("Invalid verification");
        if(!controller.signal.aborted)setVerification(data);
      })
      .catch(()=>{if(!controller.signal.aborted)setCheckFailed(true);})
      .finally(()=>{if(!controller.signal.aborted)setChecking(false);});
    return()=>controller.abort();
  },[expanded,product.sku]);
  const currentOffers=verification?.sku===product.sku?verification.offers:product.offers;
  const standardOffers=(currentOffers||[]).filter(offer=>!hasSpecialCondition(offer));
  const comparison = getPriceComparison(standardOffers);
  const verified = comparison.offers.filter((offer) => offer.priceClp !== null).length;
  const referencePrices = comparison.offers.filter((offer) => Number.isSafeInteger(offer.referencePriceClp));
  const referenceMin = referencePrices.length ? Math.min(...referencePrices.map((offer) => offer.referencePriceClp)) : null;
  const byRetailer=new Map();
  for(const offer of standardOffers){
    const price=Number.isSafeInteger(offer.priceClp)?offer.priceClp:offer.referencePriceClp;
    if(!Number.isSafeInteger(price)||price<=0)continue;
    const name=offer.sourceName.trim().toLowerCase();
    const previous=byRetailer.get(name);
    if(previous===undefined||price<previous)byRetailer.set(name,price);
  }
  const listedPrices=[...byRetailer.values()];
  const publishedSavings=listedPrices.length>=3?
    Math.max(...listedPrices)-Math.min(...listedPrices):null;
  const shownPrice = comparison.lowestPrice ?? referenceMin ?? product.historicalPriceClp ?? null;
  return (
    <article className="computer-card">
      <div className="computer-visual product-photo">
        <NotebookImage product={product} className="notebook-photo"/>
      </div>
      <div className="computer-details">
        <h3>{product.name.replace(/\s*\([^)]*\)/g,"")}</h3>
        <p className="price">{shownPrice===null ? t("labels.priceUnverified") : money(shownPrice)}
          {comparison.lowestPrice===null && referenceMin!==null &&
            <small className="reference-label">{t("labels.referencePrice")}</small>}
          {comparison.lowestPrice===null && referenceMin===null &&
            Number.isSafeInteger(product.historicalPriceClp) &&
            <small className="reference-label">{t("labels.lastRecordedPrice")}
              {product.historicalObservedAt ? " · "+
                new Date(product.historicalObservedAt).toLocaleDateString(locale==="en"?"en-US":"es-CL") : ""}
            </small>}
        </p>
        <dl className="specification-list">
          <div><dt>{t("common.ram")}</dt><dd>{t("common.memory",{value:product.ramGb})}</dd></div>
          <div><dt>{t("common.gpu")}</dt><dd>{product.gpu}</dd></div>
          <div><dt>{t("labels.processorAlternative")}</dt><dd>{product.processor}</dd></div>
        </dl>
        <div className="price-comparison">
          <button type="button" className="compare-button" aria-expanded={expanded}
            aria-controls={"offers-"+product.id} onClick={() => setExpanded(!expanded)}>
            {expanded?t("labels.hideComparison"):t("catalog.compareCount",{count:comparison.offers.length})}
          </button>
          {expanded && <div id={"offers-"+product.id} className="comparison-content">
            {checking&&<p role="status" className="feature-note">{t("labels.checkingPricesAndStockWithRetailers")}</p>}
            {checkFailed&&<p role="status" className="feature-note">{t("labels.verificationCouldNotBeCompletedTheLastAvailable")}</p>}
            {verified>=2 && <p className="comparison-summary">{t("labels.verifiedPriceDifference")}: <strong>{money(comparison.potentialSavings)}</strong></p>}
            {verified<2 && publishedSavings!==null &&
              <p className="comparison-summary">{t("labels.comparisonOfPublishedPricesFromThreeOrMore")}: <strong>{money(publishedSavings)}</strong></p>}
            {verified<2 && publishedSavings===null &&
              <p className="comparison-summary">{t("labels.notEnoughVerifiedPricesToCalculateADifference")}</p>}
            {comparison.offers.length===0 && <p className="feature-note">{t("labels.noRetailerListingsFoundYetForThisModel")} {product.profileUrl &&
              <a href={product.profileUrl} target="_blank" rel="noopener noreferrer">{t("labels.viewModelSpecifications")}</a>}</p>}
            <ul className="offer-list">{comparison.offers.map((offer) => <li key={offer.sourceId} className="offer-row">
              <span className="offer-source"><a className="retailer-link" href={offer.url} target="_blank" rel="noopener noreferrer">{offer.sourceName}</a></span>
              <strong className="offer-price">{offer.priceClp!==null?money(offer.priceClp):offer.referencePriceClp!=null
                ? money(offer.referencePriceClp)+" ("+t("labels.reference")+")":t("labels.unverified")}</strong>
              <span className="offer-extra">{offer.paymentMethod==="transfer"&&<>{t("labels.bankTransferPrice")}{" · "}</>}{offer.availability==="in_stock" ? t("labels.publishedAvailabilityInStock") :
                offer.availability==="out_of_stock" ? t("labels.publishedAvailabilitySoldOut") :
                offer.availability==="preorder" ? t("labels.publishedAvailabilityPreorder") :
                offer.reportedAvailability==="in_stock" ? t("labels.onlineAvailabilityPublishedByPublicSourceNotDirectly") :
                t("labels.stockUnverified")}</span>
              {offer.discountPercent>=20 && offer.listPriceClp>offer.priceClp &&
                <span className="retailer-discount">-{offer.discountPercent}% · <s>{money(offer.listPriceClp)}</s></span>}
              {offer.referenceDiscountPercent>=20 && offer.priceClp===null && !hasSpecialCondition(offer) &&
                <span className="retailer-discount">-{offer.referenceDiscountPercent}% · {t("labels.publishedReferenceMarkdown")}</span>}
              {offer.paymentCondition && offer.priceClp===null &&
                <span className="offer-extra">{offer.paymentCondition}</span>}
              {offer.checkedAt && <time className="checked-at" dateTime={offer.checkedAt}>
                {t("labels.checkedAlternative")} {new Date(offer.checkedAt).toLocaleString(locale==="en"?"en-US":"es-CL")}
              </time>}
            </li>)}</ul>
            <p className="demo-sources-note">{t("labels.referencePricesAreFromPublishedRetailerListingsMay")}</p>
          </div>}
        </div>
        <button type="button" className="history-button" onClick={() => onHistory(product.sku)}>
          {t("labels.seeThisLaptopSPriceHistory")}
        </button>
      </div>
    </article>
  );
}
export default function App() {
  const [theme,setTheme]=useState(initialTheme);
  const [locale,setLocale]=useState(initialLocale);
  const t = (key, values) => translate(key,locale,values);
  const [auth,setAuth]=useState(null);
  const [notebooks,setNotebooks]=useState(fromSession);
  const [status,setStatus]=useState(()=>fromSession().length?"ready":"loading");
  const [refreshing,setRefreshing]=useState(true);
  const [filters,setFilters]=useState({search:"",minRam:"",gpu:"",processor:""});
  const [selectedSku,setSelectedSku]=useState("");
  const [page,setPage]=useState(1);
  const visible = useMemo(()=>filterComputers(notebooks,filters),[notebooks,filters]);
  const options = useMemo(()=>getFilterOptions(notebooks),[notebooks]);
  const {items:currentPage,page:validPage,totalPages,first,last}=useMemo(
    ()=>paginateNotebooks(visible,page),[visible,page]);
  useEffect(()=>{if(page!==validPage)setPage(validPage);},[page,validPage]);
  const selected = notebooks.find((product) => product.sku===selectedSku) || notebooks[0] || null;
  const deals=useMemo(()=>validDeals(notebooks,new Date()),[notebooks]);

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
    let fullCatalogLoaded=false;
    // Fast: obtain real notebook identities immediately, without waiting for
    // retailer scrapers. Session cache already displays previous verified data.
    void fetch("/api/notebooks?preview=1",{signal:controller.signal})
      .then(r=>r.ok?r.json():null)
      .then(data=>{
        if(controller.signal.aborted||fullCatalogLoaded||!isValidCatalog(data))return;
        setNotebooks(current=>(current.length>0&&data.length===0)||current.length===data.length?current:data);
        setStatus("ready");
      }).catch(()=>{});
    // Fresh: refresh prices and discounts independently, without blocking
    // browsing, filtering, pagination or the first product images.
    void fetch("/api/notebooks",{signal:controller.signal,cache:"no-store"})
      .then(r=>{if(!r.ok)throw Error("Catalog unavailable");return r.json();})
      .then(data=>{
        if(!isValidCatalog(data))throw Error("Invalid catalog");
        if(controller.signal.aborted)return;
        fullCatalogLoaded=true;
        setNotebooks(data);setStatus("ready");saveSession(data);
      })
      .catch(()=>{
        if(!controller.signal.aborted){
          setStatus(current=>current==="ready"?"ready":"error");
        }
      })
      .finally(()=>{if(!controller.signal.aborted)setRefreshing(false);});
    return()=>controller.abort();
  },[]);
  async function logout() {
    try{const response=await fetch("/api/auth/logout",{method:"POST"});
      if(response.ok)setAuth((old)=>old?{...old,user:null}:null);}
    catch{}
  }
  const changeFilter=(key,value)=>{setPage(1);setFilters(old=>({...old,[key]:value}));};
  const clearFilters=()=>{setPage(1);setFilters({search:"",minRam:"",gpu:"",processor:""});};
  const changePage=(next)=>{
    setPage(Math.max(1,Math.min(totalPages,next)));
    document.getElementById("catalog-title")?.scrollIntoView?.({behavior:"smooth",block:"start"});
  };
  const chooseHistory=(sku)=>{
    setSelectedSku(sku);
    requestAnimationFrame(()=>document.getElementById("price-history-section")?.scrollIntoView({behavior:"smooth"}));
  };
  return <div className="app-shell">
    <header className="site-header"><div className="container header-inner">
      <a href="#inicio" className="brand" aria-label={t("navigation.home")}>
        <span className="brand-icon" aria-hidden="true"><span/><span/></span>
        {t("brand.first")} <span>{t("brand.second")}</span><span className="brand-dot">.</span>
      </a>
      <div className="header-actions">
        <button type="button" className="locale-toggle" aria-label={t("navigation.switchLanguage")}
          onClick={()=>setLocale((v)=>v==="es"?"en":"es")}>{t("navigation.languageCode")}</button>
        {auth?.enabled && (auth.user
          ? <button className="auth-button" type="button" onClick={logout}>{t("labels.signOut")}</button>
          : <a className="auth-button" href={auth.loginUrl||"/api/auth/login"}>{t(auth.provider==="google"?"labels.continueWithGoogle":"labels.signIn")}</a>)}
        <button type="button" className="theme-toggle" aria-label={theme==="dark"?t("labels.enableLightMode"):t("labels.enableDarkMode")}
          aria-pressed={theme==="dark"} onClick={()=>setTheme((v)=>v==="dark"?"light":"dark")}>
          <span className="theme-toggle-icon" aria-hidden="true">{theme==="dark"?"☀":"☾"}</span>
          <span className="theme-toggle-label">{theme==="dark"?t("labels.lightMode"):t("labels.darkMode")}</span>
        </button>
      </div>
    </div></header>
    <main id="inicio">
      <section className="hero container" aria-labelledby="hero-title">
        <div className="hero-content">
          <div className="hero-label"><span className="live-dot"/>{t("labels.makeInformedChoices")}</div>
          <h1 id="hero-title">{t("labels.yourNextComputer")} <em>{t("labels.clearlyCompared")}</em></h1>
          <p className="hero-description">{t("labels.filterComputersByRamGpuAndProcessorCompare")}</p>
          <div className="hero-chips" aria-label={t("labels.comparisonCriteria")}>
            <span><b>01</b><small>{t("common.ram")}</small></span><span><b>02</b><small>{t("common.gpu")}</small></span>
            <span><b>03</b><small>{t("labels.processor")}</small></span>
          </div>
        </div>
        <DealsCarousel deals={deals} loading={refreshing} t={t} locale={locale}/>
      </section>
      <section className="catalog-section" aria-labelledby="catalog-title">
        <div className="container">
          <div className="section-heading"><div>
            <p className="section-kicker">{t("labels.exploreCatalog")}</p>
            <h2 id="catalog-title">{t("labels.laptopsAvailableToCompare")}</h2>
            <p className="section-subtitle">{t("labels.compareSpecsAndPublishedOffersPricesAndStock")}</p>
          </div>{status==="ready" && <span className="result-count" aria-live="polite">{visible.length} / {notebooks.length}</span>}</div>
          {status==="ready" && refreshing &&
            <p className="catalog-refreshing" role="status">{t("labels.updatingPricesAndDiscounts")}</p>}
          {status==="ready" && notebooks.length>0 && <CatalogFilters filters={filters} options={options}
            t={t} onChange={changeFilter}
            onClear={clearFilters}/>}
          {status==="loading" && <div className="state-panel" role="status">{t("labels.loadingRealLaptops")}</div>}
          {status==="error" && <div className="state-panel error-panel" role="alert">{t("labels.unableToLoadTheLaptopCatalog")}</div>}
          {status==="ready" && notebooks.length===0 && <div className="state-panel">{t("labels.noValidatedLaptopsAvailable")}</div>}
          {status==="ready" && notebooks.length>0 && visible.length===0 &&
            <div className="state-panel no-results"><p>{t("labels.noComputersMatchTheseFilters")}</p>
              <button type="button" className="clear-filters"
                onClick={clearFilters}>{t("labels.clearFilters")}</button>
            </div>}
          {status==="ready" && visible.length>0 && <div className="computer-grid">
            {currentPage.map((product)=><ProductCard key={product.sku} product={product}
              t={t} locale={locale} onHistory={chooseHistory}/>)}
          </div>}
          {status==="ready" && visible.length>PAGE_SIZE && <nav className="catalog-pagination"
            aria-label={t("labels.catalogPages")}>
            <p className="pagination-info" aria-live="polite">{t("catalog.pagination",{first,last,count:visible.length,page:validPage,pages:totalPages})}</p>
            <div className="pagination-controls">
              <button type="button" onClick={()=>changePage(validPage-1)} disabled={validPage===1}
                aria-label={t("labels.previousPage")}>‹</button>
              {Array.from({length:totalPages},(_,i)=>i+1).map(n=><button type="button"
                key={n} aria-current={n===validPage?"page":undefined}
                onClick={()=>changePage(n)}>{n}</button>)}
              <button type="button" onClick={()=>changePage(validPage+1)} disabled={validPage===totalPages}
                aria-label={t("labels.nextPage")}>›</button>
            </div>
          </nav>}
        </div>
      </section>
      {selected && <div id="price-history-section">
        <div className="container feature-product-picker">
          <label htmlFor="feature-product">{t("labels.historyAndStoresFor")}:</label>
          <select id="feature-product" value={selected.sku} onChange={(e)=>setSelectedSku(e.target.value)}>
            {notebooks.map((n)=><option key={n.sku} value={n.sku}>{n.name}</option>)}
          </select>
        </div>
        <FeaturesPanel liveComputer={selected} t={t} locale={locale}/>
      </div>}
    </main>
    <footer className="site-footer"><div className="container footer-inner"><span>{t("brand.copyright")}</span><span>{t("labels.softwareDesignProject4b")}</span></div></footer>
  </div>;
}
