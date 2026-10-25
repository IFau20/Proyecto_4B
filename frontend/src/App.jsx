import { useEffect, useState } from "react";

const formatPrice = (priceClp) => `$${new Intl.NumberFormat("es-CL").format(priceClp)}`;

function ComputerCard({ computer, index }) {
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
        <p className="card-eyebrow">COMPUTADOR DE EJEMPLO</p>
        <h3>{computer.name}</h3>
        <p className="price">{formatPrice(computer.priceClp)} <span>CLP</span></p>
        <dl className="specification-list">
          <div><dt>RAM</dt><dd>{computer.ramGb} GB</dd></div>
          <div><dt>GPU</dt><dd>{computer.gpu}</dd></div>
          <div><dt>Procesador</dt><dd>{computer.processor}</dd></div>
        </dl>
      </div>
    </article>
  );
}

export default function App() {
  const [computers, setComputers] = useState([]);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    const controller = new AbortController();

    async function loadComputers() {
      try {
        const response = await fetch("/api/computers", { signal: controller.signal });
        if (!response.ok) throw new Error("API request failed");

        const data = await response.json();
        if (!Array.isArray(data)) throw new Error("Invalid catalog response");

        if (!controller.signal.aborted) {
          setComputers(data);
          setStatus("ready");
        }
      } catch {
        if (!controller.signal.aborted) setStatus("error");
      }
    }

    loadComputers();
    return () => controller.abort();
  }, []);

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="container header-inner">
          <a className="brand" href="#inicio" aria-label="CompuClaro, ir al inicio">
            <span className="brand-icon" aria-hidden="true"><span /><span /></span>
            Compu<span>Claro</span><span className="brand-dot">.</span>
          </a>
          <span className="header-tag">PROYECTO 4B · SEMANA 01</span>
        </div>
      </header>

      <main id="inicio">
        <section className="hero container" aria-labelledby="hero-title">
          <div className="hero-content">
            <div className="hero-label"><span className="live-dot" /> ELIGE CON MÁS INFORMACIÓN</div>
            <h1 id="hero-title">Tu próximo computador, <em>más claro.</em></h1>
            <p className="hero-description">Explora equipos y revisa sus características principales en un solo lugar. Una forma más simple de empezar a comparar.</p>
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
                <p className="section-subtitle">Compara las especificaciones que realmente te importan.</p>
              </div>
              {status === "ready" && <span className="result-count">{computers.length} equipos de ejemplo</span>}
            </div>

            {status === "loading" && <div className="state-panel" role="status">Cargando computadores…</div>}
            {status === "error" && <div className="state-panel error-panel" role="alert">No se pudo cargar el catálogo. Comprueba que el servidor Deno esté ejecutándose e inténtalo de nuevo.</div>}
            {status === "ready" && computers.length === 0 && <div className="state-panel">Todavía no hay computadores disponibles.</div>}
            {status === "ready" && computers.length > 0 && (
              <div className="computer-grid">
                {computers.map((computer, index) => <ComputerCard key={computer.id} computer={computer} index={index} />)}
              </div>
            )}
            <p className="catalog-notice">Nota: este es un prototipo académico. Los modelos y precios son ficticios y no representan ofertas reales.</p>
          </div>
        </section>
      </main>

      <footer className="site-footer"><div className="container footer-inner"><span>CompuClaro © 2026</span><span>Diseño de Software · Proyecto 4B</span></div></footer>
    </div>
  );
}
