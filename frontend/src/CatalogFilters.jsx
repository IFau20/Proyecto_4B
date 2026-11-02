export default function CatalogFilters({ filters, options, onChange, onClear }) {
  const hasActiveFilters = Object.values(filters).some(Boolean);

  return (
    <form className="catalog-filters" role="search" aria-label="Buscar y filtrar computadores" onSubmit={(event) => event.preventDefault()}>
      <div className="filter-heading">
        <div>
          <h3>Encuentra tu computador</h3>
          <p>Busca y combina los tres criterios del proyecto.</p>
        </div>
        <span className="filter-tag">FILTROS</span>
      </div>
      <div className="filter-grid">
        <div className="filter-field">
          <label htmlFor="computer-search">Buscar computador</label>
          <input id="computer-search" type="search" value={filters.search} onChange={(event) => onChange("search", event.target.value)} placeholder="Nombre, GPU o procesador" />
        </div>
        <div className="filter-field">
          <label htmlFor="ram-filter">RAM mínima</label>
          <select id="ram-filter" value={filters.minRam} onChange={(event) => onChange("minRam", event.target.value)}>
            <option value="">Cualquier RAM</option>
            {options.ram.map((ram) => <option key={ram} value={ram}>{ram} GB o más</option>)}
          </select>
        </div>
        <div className="filter-field">
          <label htmlFor="gpu-filter">GPU</label>
          <select id="gpu-filter" value={filters.gpu} onChange={(event) => onChange("gpu", event.target.value)}>
            <option value="">Todas las GPU</option>
            {options.gpus.map((gpu) => <option key={gpu} value={gpu}>{gpu}</option>)}
          </select>
        </div>
        <div className="filter-field">
          <label htmlFor="processor-filter">Procesador</label>
          <select id="processor-filter" value={filters.processor} onChange={(event) => onChange("processor", event.target.value)}>
            <option value="">Todos los procesadores</option>
            {options.processors.map((processor) => <option key={processor} value={processor}>{processor}</option>)}
          </select>
        </div>
      </div>
      <div className="filter-footer">
        <span>Los filtros se aplican en conjunto.</span>
        {hasActiveFilters && <button type="button" className="clear-filters" onClick={onClear}>Limpiar filtros</button>}
      </div>
    </form>
  );
}
