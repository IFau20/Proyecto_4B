import { expect, it } from "vitest";
import { translate, initialLocale, formatMoney } from "./i18n.js";
import es from "./locales/es.json";
import en from "./locales/en.json";
it("keeps complete matching Spanish and English semantic resources", () => {
 expect(Object.keys(es).sort()).toEqual(Object.keys(en).sort());
 for (const key of Object.keys(es)) {
  expect(key).toMatch(/^[a-z][a-zA-Z0-9.]+$/);
  expect(es[key].trim()).not.toBe(""); expect(en[key].trim()).not.toBe("");
  expect(translate(key,"es")).toBe(es[key]); expect(translate(key,"en")).toBe(en[key]);
 }
});
it("translates semantic keys and preserves manufacturer names", () => {
 expect(translate("filters.search","es")).toBe("Buscar computador");
 expect(translate("filters.search","en")).toBe("Search computers");
 expect(translate("RTX 4050","en")).toBe("RTX 4050");
});
it("uses browser language unless a supported preference was saved", () => {
 expect(initialLocale({getItem:()=>null},["en-GB","es-CL"])).toBe("en");
 expect(initialLocale({getItem:()=>null},["fr-FR","es-CL"])).toBe("es");
 expect(initialLocale({getItem:()=>"es"},["en-US"])).toBe("es");
 expect(initialLocale({getItem:()=>"invalid"},["en-US"])).toBe("en");
 expect(initialLocale({getItem:()=>{throw Error();}},["en-US"])).toBe("en");
});
it("formats CLP values with the active locale", () => {
 expect(formatMoney(500000,"es")).toBe("$500.000");
 expect(formatMoney(500000,"en")).toBe("$500,000");
});
it("provides every statically referenced UI translation",()=>{
 const components=import.meta.glob("./*.jsx",{query:"?raw",import:"default",eager:true});
 for(const [file,source] of Object.entries(components)){
  if(file.endsWith(".test.jsx"))continue;
  for(const match of source.matchAll(/\bt\("([a-zA-Z0-9.]+)"/g)){
   if(match[1].endsWith("."))continue;
   expect(es,`${file}: ${match[1]}`).toHaveProperty(match[1]);
   expect(en,`${file}: ${match[1]}`).toHaveProperty(match[1]);
  }
 }
});
it("interpolates labels without leaking placeholders",()=>{
 expect(translate("catalog.compareCount","en",{count:3})).toBe("Compare stores (3)");
 expect(translate("stores.opening","en",{day:translate("weekdays.mon","en"),ranges:"09:00–18:00"})).toBe("Mon 09:00–18:00 · Regular opening hours checked");
});
