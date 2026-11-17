import { translate } from "./i18n.js";
export default function CatalogFilters({ filters, options, onChange, onClear, t = translate }) {
  const hasActiveFilters = Object.values(filters).some(Boolean);

  return (
    <form className="catalog-filters" role="search" aria-label={t("labels.searchAndFilterComputers")} onSubmit={(event) => event.preventDefault()}>
      <div className="filter-heading">
        <div>
          <h3>{t("labels.findYourComputer")}</h3>
          <p>{t("labels.searchAndCombineAllThreeProjectCriteria")}</p>
        </div>
        <span className="filter-tag">{t("labels.filters")}</span>
      </div>
      <div className="filter-grid">
        <div className="filter-field">
          <label htmlFor="computer-search">{t("filters.search")}</label>
          <input id="computer-search" type="search" value={filters.search} onChange={(event) => onChange("search", event.target.value)} placeholder={t("labels.nameGpuOrProcessor")} />
        </div>
        <div className="filter-field">
          <label htmlFor="ram-filter">{t("labels.minimumRam")}</label>
          <select id="ram-filter" value={filters.minRam} onChange={(event) => onChange("minRam", event.target.value)}>
            <option value="">{t("labels.anyRam")}</option>
            {options.ram.map((ram) => <option key={ram} value={ram}>{ram} {t("labels.gbOrMore")}</option>)}
          </select>
        </div>
        <div className="filter-field">
          <label htmlFor="gpu-filter">{t("common.gpu")}</label>
          <select id="gpu-filter" value={filters.gpu} onChange={(event) => onChange("gpu", event.target.value)}>
            <option value="">{t("labels.allGpus")}</option>
            {options.gpus.map((gpu) => <option key={gpu} value={gpu}>{gpu}</option>)}
          </select>
        </div>
        <div className="filter-field">
          <label htmlFor="processor-filter">{t("labels.processorAlternative")}</label>
          <select id="processor-filter" value={filters.processor} onChange={(event) => onChange("processor", event.target.value)}>
            <option value="">{t("labels.allProcessors")}</option>
            {options.processors.map((processor) => <option key={processor} value={processor}>{processor}</option>)}
          </select>
        </div>
      </div>
      <div className="filter-footer">
        <span>{t("labels.filtersAreAppliedTogether")}</span>
        {hasActiveFilters && <button type="button" className="clear-filters" onClick={onClear}>{t("labels.clearFilters")}</button>}
      </div>
    </form>
  );
}
