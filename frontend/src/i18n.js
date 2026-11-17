import es from "./locales/es.json";
import en from "./locales/en.json";
export const resources = { es, en };
export const LOCALE_KEY = "pc-tracker-locale";
export function translate(key, locale = "es", values = {}) {
  const text = resources[locale]?.[key] ?? es[key] ?? key;
  return text.replace(/\{(\w+)\}/g, (match, name) => values[name] ?? match);
}
export function initialLocale(storage, languages) {
  try {
    const saved = (storage ?? globalThis.localStorage)?.getItem(LOCALE_KEY);
    if (saved === "es" || saved === "en") return saved;
  } catch { /* Language detection still works when storage is unavailable. */ }
  const preferred = languages ?? globalThis.navigator?.languages ?? [globalThis.navigator?.language];
  for (const language of preferred) {
    const base = String(language).toLowerCase().split(/[-_]/)[0];
    if (base === "es" || base === "en") return base;
  }
  return "es";
}
export const formatNumber = (value, locale = "es", options) =>
  new Intl.NumberFormat(locale === "en" ? "en-US" : "es-CL", options).format(value);
// Values always remain Chilean pesos; only punctuation changes with the UI locale.
export const formatMoney = (value, locale = "es") => "$" + formatNumber(Number(value), locale);
