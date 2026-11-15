import { expect, it } from "vitest";
import { kilometersBetween } from "./FeaturesPanel.jsx";
it("returns zero distance for the same location", () => {
  expect(kilometersBetween({lat:-33.43,lon:-70.61},{lat:-33.43,lon:-70.61})).toBe(0);
});
it("computes positive distances for two distinct stores", () => {
  const km=kilometersBetween({lat:-33.42419,lon:-70.61829},{lat:-33.4478,lon:-70.611});
  expect(km).toBeGreaterThan(2);
  expect(km).toBeLessThan(4);
});
