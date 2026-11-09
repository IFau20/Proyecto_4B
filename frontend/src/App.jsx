import { useEffect, useState } from "react";
import CatalogFilters from "./CatalogFilters.jsx";
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


function ComputerCard({ computer, index }) {
  const [showOffers, setShowOffers] = useState(false);
  const comparison = getPriceComparison(computer.offers);

  return (
    <article className="computer-card">
      <div className="computer-visual" aria-hidden="true">
        <span className="model-index">MODELO {String(index + 1).padStart(2, "0")}</span>
        <div className="laptop-illustration">
          <div className="laptop-screen"><span className="screen-mark" /></div>
          <div className="laptop-base" />
        </div>
      </div>
      <div className="computer-details">
        <p className="card-eyebrow">{computer.isLive ? "MODELO REAL · TRES TIENDAS" : "COMPUTADOR DE EJEMPLO"}</p>
        <h3>{computer.name}</h3>
        <p className="price">
          {comparison.lowestPrice === null ? "Sin precios" : formatPrice(comparison.lowestPrice)}
          {comparison.lowestPrice !== null && <span>CLP · desde</span>}
        </p>
        <dl className="specification-list">
          <div><dt>RAM</dt><dd>{computer.ramGb} GB</dd></div>
          <div><dt>GPU</dt><dd>{computer.gpu}</dd></div>
          <div><dt>Procesador</dt><dd>{computer.processor}</dd></div>
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
            {showOffers ? "Ocultar comparación" : `Comparar precios (${comparison.offers.length} fuentes)`}
          </button>
          {showOffers && (
            <div id={`offers-${computer.id}`} className="comparison-content">
              <p className="comparison-summary">Diferencia entre precios disponibles: <strong>{comparison.lowestPrice === null ? "No verificada" : formatPrice(comparison.potentialSavings)}</strong></p>
              <ul className="offer-list">
                {comparison.offers.map((offer, offerIndex) => (
                  <li key={offer.sourceId} className={offerIndex === 0 ? "offer-row best-offer" : "offer-row"}>
                    <span className="offer-source">{offer.url
                      ? <a className="retailer-link" href={offer.url} target="_blank" rel="noopener noreferrer">{offer.sourceName}</a>
                      : offer.sourceName}</span>
                    <strong className="offer-price">{offer.priceClp === null ? "No verificado" : formatPrice(offer.priceClp)}</strong>
                    <span className="offer-extra">{offer.priceClp === null ? "No se pudo confirmar el precio" :
                      offer.priceClp === comparison.lowestPrice ? "Menor precio" :
                      `+${formatPrice(offer.priceClp - comparison.lowestPrice)} frente al menor`}</span>
                  </li>
                ))}
              </ul>
              <p className="demo-sources-note">{computer.isLive ? "Enlaces reales. Confirma los precios directamente con cada comercio." : "Fuentes y precios ficticios para la demostración."}</p>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

export default function App() {
  const [theme, setTheme] = useState(getInitialTheme);
  const [demoComputers, setDemoComputers] = useState([]);
  const [liveComputer, setLiveComputer] = useState(null);
  const [liveStatus, setLiveStatus] = useState("loading");
  const computers = liveComputer ? [liveComputer, ...demoComputers] : demoComputers;
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

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="container header-inner">
          <a className="brand" href="#inicio" aria-label="PC Tracker, ir al inicio">
            <span className="brand-icon" aria-hidden="true"><span /><span /></span>
            PC <span>Tracker</span><span className="brand-dot">.</span>
          </a>
          <div className="header-actions">
            <span className="header-tag">PROYECTO 4B · SEMANA 03</span>
            <button
              className="theme-toggle"
              type="button"
              aria-label={theme === "dark" ? "Activar modo claro" : "Activar modo oscuro"}
              aria-pressed={theme === "dark"}
              onClick={() => setTheme((current) => current === "dark" ? "light" : "dark")}
            >
              <span className="theme-toggle-icon" aria-hidden="true">{theme === "dark" ? "☀" : "☾"}</span>
              <span className="theme-toggle-label">{theme === "dark" ? "Modo claro" : "Modo oscuro"}</span>
            </button>
          </div>
        </div>
      </header>

      <main id="inicio">
        <section className="hero container" aria-labelledby="hero-title">
          <div className="hero-content">
            <div className="hero-label"><span className="live-dot" /> ELIGE CON MÁS INFORMACIÓN</div>
            <h1 id="hero-title">Tu próximo computador, <em>más claro.</em></h1>
            <p className="hero-description">Explora equipos y compara los precios de un mismo computador entre tres fuentes de prueba. Una base para encontrar mejores ofertas.</p>
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
                <p className="section-kicker">EXPLORA / CATÁLOGO</p>
                <h2 id="catalog-title">Computadores disponibles</h2>
                <p className="section-subtitle">Filtra por especificaciones y revisa los precios de tres fuentes de ejemplo.</p>
              </div>
              {status === "ready" && <span className="result-count" aria-live="polite">{filteredComputers.length} de {computers.length} equipos</span>}
            </div>

            <p className="live-catalog-status" role="status">{liveStatus === "loading" ? "Consultando tres tiendas para el modelo real…" :
              liveStatus === "error" ? "No se pudo consultar el modelo real; el catálogo de prueba sigue disponible." :
              "Modelo real incorporado con enlaces a tres tiendas. Los precios se muestran solo si se verifican."}</p>
            {status === "ready" && computers.length > 0 && (
              <CatalogFilters filters={filters} options={filterOptions} onChange={updateFilter} onClear={clearFilters} />
            )}
            {status === "loading" && <div className="state-panel" role="status">Cargando computadores…</div>}
            {status === "error" && <div className="state-panel error-panel" role="alert">No se pudo cargar el catálogo. Comprueba que el servidor Deno esté ejecutándose e inténtalo de nuevo.</div>}
            {status === "ready" && computers.length === 0 && <div className="state-panel">Todavía no hay computadores disponibles.</div>}
            {status === "ready" && computers.length > 0 && filteredComputers.length === 0 && (
              <div className="state-panel no-results">
                <p>No encontramos computadores con esos filtros.</p>
                <button type="button" className="clear-filters" onClick={clearFilters}>Limpiar filtros</button>
              </div>
            )}
            {status === "ready" && filteredComputers.length > 0 && (
              <div className="computer-grid">
                {filteredComputers.map((computer, index) => <ComputerCard key={computer.id} computer={computer} index={index} />)}
              </div>
            )}
            <p className="catalog-notice">Nota: los cuatro equipos originales son ficticios. El Lenovo LOQ 83JC0080CL es un modelo real; sus precios solo aparecen cuando se pueden verificar.</p>
          </div>
        </section>
      </main>

      <footer className="site-footer"><div className="container footer-inner"><span>PC Tracker © 2026</span><span>Diseño de Software · Proyecto 4B</span></div></footer>
    </div>
  );
}
