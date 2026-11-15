import { expect, it } from "vitest";
import { translate } from "./i18n.js";
it("keeps Spanish source labels as default", () => {
  expect(translate("Buscar computador", "es")).toBe("Buscar computador");
});
it("uses curated English translations without external services", () => {
  expect(translate("Buscar computador", "en")).toBe("Search computers");
  expect(translate("Stock sin verificar", "en")).toBe("Stock unverified");
});
it("preserves manufacturer and vendor names", () => {
  expect(translate("RTX 4050", "en")).toBe("RTX 4050");
});
