import { useEffect, useState } from "react";
import CatalogFilters from "./CatalogFilters.jsx";
import FeaturesPanel from "./FeaturesPanel.jsx";
import { translate } from "./i18n.js";
import { filterComputers, getFilterOptions } from "./catalogFilters.js";
import { getPriceComparison } from "./priceComparison.js";

const formatPrice = (priceClp) => `$${new Intl.NumberFormat("es-CL").format(priceClp)}`;

const THEME_STORAGE_KEY = "pc-tracker-theme";

function getInitialTheme() {
  try {
    const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (savedTheme === "dark" || savedTheme === "light") return savedTheme;
  } catch {
    // Browsers can disable local storage; the theme switch should still work.
  }

  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}


function ComputerCard({ computer, index, t }) {
  const [showOffers, setShowOffers] = useState(false);
  const comparison = getPriceComparison(computer.offers);
  const verifiedPriceCount = computer.isLive
    ? (computer.verification?.verifiedPrices ?? comparison.offers.filter((offer) => offer.priceClp !== null).length)
    : comparison.offers.length;

  return (
    <article className="computer-card">
      <div className="computer-visual" aria-hidden="true">
        <span className="model-index">{t("MODELO")} {String(index + 1).padStart(2, "0")}</span>
        <div className="laptop-illustration">
          <div className="laptop-screen"><span className="screen-mark" /></div>
          <div className="laptop-base" />
        </div>
      </div>
      <div className="computer-details">
        <p className="card-eyebrow">{computer.isLive ? t("MODELO REAL · TRES TIENDAS") : t("COMPUTADOR DE EJEMPLO")}</p>
        <h3>{computer.name}</h3>
        <p className="price">
          {comparison.lowestPrice === null ? t("Sin precios") : formatPrice(comparison.lowestPrice)}
          {comparison.lowestPrice !== null && <span>CLP · desde</span>}
          {computer.isLive && <small className="price-coverage">
            {verifiedPriceCount} de {comparison.offers.length} {t("precios verificados")}
          </small>}
        </p>
        <dl className="specification-list">
          <div><dt>RAM</dt><dd>{computer.ramGb} GB</dd></div>
          <div><dt>GPU</dt><dd>{computer.gpu}</dd></div>
          <div><dt>{t("Procesador")}</dt><dd>{computer.processor}</dd></div>
        </dl>
        <div className="price-comparison">
          <button
            type="button"
            className="compare-button"
            aria-expanded={showOffers}
            aria-controls={`offers-${computer.id}`}
            disabled={comparison.offers.length === 0}
            onClick={() => setShowOffers((current) => !current)}
          >
            {showOffers ? t("Ocultar comparación") : t("Comparar precios") + " (" + comparison.offers.length + " " + t("fuentes") + ")"}
          </button>
          {showOffers && (
            <div id={`offers-${computer.id}`} className="comparison-content">
              <p className="comparison-summary">{t("Diferencia entre precios:")} <strong>
                {verifiedPriceCount < 2 ? t("Se necesitan dos precios verificados") : formatPrice(comparison.potentialSavings)}
              </strong></p>
              <ul className="offer-list">
                {comparison.offers.map((offer) => (
                  <li key={offer.sourceId} className={comparison.lowestPrice !== null && offer.priceClp === comparison.lowestPrice ? "offer-row best-offer" : "offer-row"}>
                    <span className="offer-source">{offer.url
                      ? <a className="retailer-link" href={offer.url} target="_blank" rel="noopener noreferrer">{offer.sourceName}</a>
                      : offer.sourceName}</span>
                    <strong className="offer-price">{offer.priceClp === null ? t("No verificado") : formatPrice(offer.priceClp)}</strong>
                    <span className="offer-extra">{offer.priceClp === null
                      ? offer.queryStatus === "blocked" ? t("Tienda bloqueó la consulta")
                        : offer.queryStatus === "http_error" ? t("Error de la página de la tienda")
                        : offer.queryStatus === "network_error" ? t("No se pudo conectar con la tienda")
                        : t("Precio no publicado o no verificable")
                      : offer.priceClp === comparison.lowestPrice ? t("Menor precio encontrado") :
                        "+" + formatPrice(offer.priceClp - comparison.lowestPrice) + " " + t("frente al menor")}</span>
                  </li>
                ))}
              </ul>
              {computer.isLive && (
                <ul className="stock-list" aria-label={t("Disponibilidad de las tiendas")}>
                  {comparison.offers.map((offer) => (
                    <li key={offer.sourceId}>
                      <strong>{offer.sourceName}</strong>
                      <span className={`stock-status stock-${offer.availability ?? "unknown"}`}>
                        {offer.availability === "in_stock" ? t("Stock publicado: disponible") :
                          offer.availability === "out_of_stock" ? t("Stock publicado: agotado") :
                          offer.availability === "preorder" ? t("Stock publicado: reserva") :
                          t("Stock sin verificar")}
                      </span>
                      {offer.checkedAt && <time className="checked-at" dateTime={offer.checkedAt}>
                        Consulta: {new Date(offer.checkedAt).toLocaleString("es-CL")}
                      </time>}
                    </li>
                  ))}
                </ul>
              )}
              <p className="demo-sources-note">{computer.isLive ? t("Enlaces reales. Confirma los precios directamente con cada comercio.") : t("Fuentes y precios ficticios para la demostración.")}</p>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

export default function App() {
  const [theme, setTheme] = useState(getInitialTheme);
  const [locale, setLocale] = useState(() => {
    try { return window.localStorage.getItem("pc-tracker-locale") === "en" ? "en" : "es"; }
    catch { return "es"; }
  });
  const [auth, setAuth] = useState(null);
  const t = (key) => translate(key, locale);
  const [demoComputers, setDemoComputers] = useState([]);
  const [liveComputer, setLiveComputer] = useState(null);
  const [hpComputer, setHpComputer] = useState(null);
  const [hpStatus, setHpStatus] = useState("loading");
  const [selectedSku, setSelectedSku] = useState("");
  const liveProducts = [hpComputer, liveComputer].filter(Boolean);
  const [liveStatus, setLiveStatus] = useState("loading");
  const computers = [...liveProducts, ...demoComputers];
  const displayedLiveProduct = liveProducts.find((computer) => computer.sku === selectedSku) ?? liveProducts[0] ?? null;
  const [status, setStatus] = useState("loading");
  const [filters, setFilters] = useState({ search: "", minRam: "", gpu: "", processor: "" });
  const filteredComputers = filterComputers(computers, filters);
  const filterOptions = getFilterOptions(computers);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Theme remains usable even when persistence is unavailable.
    }
  }, [theme]);

  useEffect(() => {
    document.documentElement.lang = locale;
    try { window.localStorage.setItem("pc-tracker-locale", locale); } catch {}
  }, [locale]);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/auth/me", { signal: controller.signal })
      .then((response) => response.ok ? response.json() : null)
      .then((data) => { if (!controller.signal.aborted && data && !Array.isArray(data)) setAuth(data); })
      .catch(() => {});
    return () => controller.abort();
  }, []);

  async function logout() {
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (response.ok) setAuth((old) => old ? { ...old, user: null } : null);
    } catch {}
  }

  function updateFilter(key, value) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  function clearFilters() {
    setFilters({ search: "", minRam: "", gpu: "", processor: "" });
  }

  useEffect(() => {
    const controller = new AbortController();

    async function loadComputers() {
      try {
        const response = await fetch("/api/computers", { signal: controller.signal });
        if (!response.ok) throw new Error("API request failed");

        const data = await response.json();
        if (!Array.isArray(data)) throw new Error("Invalid catalog response");

        if (!controller.signal.aborted) {
          setDemoComputers(data);
          setStatus("ready");
        }
      } catch {
        if (!controller.signal.aborted) setStatus("error");
      }
    }

    loadComputers();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    async function loadLive() {
      try {
        const response = await fetch("/api/live-comparisons", { signal: controller.signal });
        if (!response.ok) throw Error("Live API unavailable");
        const computer = await response.json();
        if (!computer?.isLive || !Array.isArray(computer.offers)) throw Error("Invalid response");
        if (!controller.signal.aborted) { setLiveComputer(computer); setLiveStatus("ready"); }
      } catch {
        if (!controller.signal.aborted) setLiveStatus("error");
      }
    }
    loadLive();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    async function loadHpComputer() {
      try {
        const response = await fetch("/api/live-comparisons-hp", { signal: controller.signal });
        if (!response.ok) throw Error("HP comparison unavailable");
        const computer = await response.json();
        if (!computer?.isLive || !Array.isArray(computer.offers) || computer.sku !== "DB9V5AT#ABM") {
          throw Error("Invalid HP data");
        }
        if (!controller.signal.aborted) { setHpComputer(computer); setHpStatus("ready"); }
      } catch {
        if (!controller.signal.aborted) setHpStatus("error");
      }
    }
    loadHpComputer();
    return () => controller.abort();
  }, []);

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="container header-inner">
          <a className="brand" href="#inicio" aria-label="PC Tracker, ir al inicio">
            <span className="brand-icon" aria-hidden="true"><span /><span /></span>
            PC <span>Tracker</span><span className="brand-dot">.</span>
          </a>
          <div className="header-actions">
            <span className="header-tag">{t("PROYECTO 4B · AVANCE 05")}</span>
            <button className="locale-toggle" type="button"
              aria-label={locale === "es" ? "Switch to English" : "Cambiar a español"}
              onClick={() => setLocale((value) => value === "es" ? "en" : "es")}>
              {locale === "es" ? "EN" : "ES"}
            </button>
            {auth?.enabled && (auth.user
              ? <button type="button" className="auth-button" onClick={logout}>{t("Cerrar sesión")}</button>
              : <a className="auth-button" href="/api/auth/login">{t("Iniciar sesión")}</a>)}
            {auth && !auth.enabled && <span className="sso-unconfigured">{t("SSO sin configurar")}</span>}
            <button
              className="theme-toggle"
              type="button"
              aria-label={theme === "dark" ? t("Activar modo claro") : t("Activar modo oscuro")}
              aria-pressed={theme === "dark"}
              onClick={() => setTheme((current) => current === "dark" ? "light" : "dark")}
            >
              <span className="theme-toggle-icon" aria-hidden="true">{theme === "dark" ? "☀" : "☾"}</span>
              <span className="theme-toggle-label">{theme === "dark" ? t("Modo claro") : t("Modo oscuro")}</span>
            </button>
          </div>
        </div>
      </header>

      <main id="inicio">
        <section className="hero container" aria-labelledby="hero-title">
          <div className="hero-content">
            <div className="hero-label"><span className="live-dot" /> ELIGE CON MÁS INFORMACIÓN</div>
            <h1 id="hero-title">{t("Tu próximo computador,")} <em>{t("más claro.")}</em></h1>
            <p className="hero-description">{t("Filtra computadores por RAM, GPU y procesador y compara precios y stock cuando cada tienda publique esos datos.")}</p>
            <div className="hero-chips" aria-label="Criterios de comparación">
              <span>01 / RAM</span><span>02 / GPU</span><span>03 / PROCESADOR</span>
            </div>
          </div>
          <div className="hero-art" aria-hidden="true">
            <div className="art-grid" />
            <div className="art-laptop"><div className="art-screen"><div className="art-orb" /></div><div className="art-base" /></div>
            <span className="art-sticker sticker-one">RAM <strong>16 GB</strong></span>
            <span className="art-sticker sticker-two">GPU <strong>RTX 4050</strong></span>
          </div>
        </section>

        <section className="catalog-section" aria-labelledby="catalog-title">
          <div className="container">
            <div className="section-heading">
              <div>
                <p className="section-kicker">{t("EXPLORA / CATÁLOGO")}</p>
                <h2 id="catalog-title">{t("Computadores disponibles")}</h2>
                <p className="section-subtitle">{t("Filtra por especificaciones y consulta precios y stock cuando la fuente permita verificarlos.")}</p>
              </div>
              {status === "ready" && <span className="result-count" aria-live="polite">{filteredComputers.length} {locale === "es" ? "de" : "of"} {computers.length} {t("equipos")}</span>}
            </div>

            <p className="live-catalog-status">{liveStatus === "loading" ? t("Consultando tres tiendas para el modelo real…") :
              liveStatus === "error" ? t("No se pudo consultar el modelo real; el catálogo de prueba sigue disponible.") :
              liveComputer?.verification?.comparable
                ? t("Comparación de tres precios verificados disponible.")
                : `Consulta de tiendas: ${liveComputer?.verification?.verifiedPrices ?? 0} de 3 precios verificados. Las fuentes restantes figuran sin verificar.`}</p>
            <p className="live-catalog-status">
              {hpStatus === "loading" ? (locale === "es" ? "Consultando cuatro tiendas para el HP 250R…" : "Checking four retailers for the HP 250R…") :
                hpStatus === "error" ? (locale === "es" ? "No se pudo consultar el HP 250R; siguen disponibles los demás productos." : "HP 250R lookup failed; other products remain available.") :
                (locale === "es" ? "HP 250R: " : "HP 250R: ") + (hpComputer?.verification?.verifiedPrices ?? 0) +
                  (locale === "es" ? " de 4 precios verificados." : " of four prices verified.")}
            </p>
            {status === "ready" && computers.length > 0 && (
              <CatalogFilters filters={filters} options={filterOptions} onChange={updateFilter} onClear={clearFilters} t={t} />
            )}
            {status === "loading" && <div className="state-panel" role="status">{t("Cargando computadores…")}</div>}
            {status === "error" && <div className="state-panel error-panel" role="alert">{t("No se pudo cargar el catálogo. Comprueba que el servidor Deno esté ejecutándose e inténtalo de nuevo.")}</div>}
            {status === "ready" && computers.length === 0 && <div className="state-panel">{t("Todavía no hay computadores disponibles.")}</div>}
            {status === "ready" && computers.length > 0 && filteredComputers.length === 0 && (
              <div className="state-panel no-results">
                <p>{t("No encontramos computadores con esos filtros.")}</p>
                <button type="button" className="clear-filters" onClick={clearFilters}>{t("Limpiar filtros")}</button>
              </div>
            )}
            {status === "ready" && filteredComputers.length > 0 && (
              <div className="computer-grid">
                {filteredComputers.map((computer, index) => <ComputerCard key={computer.id} computer={computer} index={index} t={t} />)}
              </div>
            )}
            <p className="catalog-notice">{t("Nota: los cuatro equipos originales son ficticios. El Lenovo LOQ 83JC0080CL es un modelo real; sus precios solo aparecen cuando se pueden verificar.")}</p>
          </div>
        </section>
        {liveProducts.length > 1 && (
          <div className="container feature-product-picker">
            <label htmlFor="feature-product">
              {locale === "es" ? "Consultar historial y tiendas de:" : "Show history and stores for:"}
            </label>
            <select id="feature-product" value={displayedLiveProduct?.sku ?? ""}
              onChange={(event) => setSelectedSku(event.target.value)}>
              {liveProducts.map((computer) =>
                <option key={computer.sku} value={computer.sku}>{computer.name}</option>)}
            </select>
          </div>
        )}
        <FeaturesPanel liveComputer={displayedLiveProduct} t={t} locale={locale} />
      </main>

      <footer className="site-footer"><div className="container footer-inner"><span>PC Tracker © 2026</span><span>Diseño de Software · Proyecto 4B</span></div></footer>
    </div>
  );
}
