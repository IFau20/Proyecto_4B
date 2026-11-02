import { expect, it } from "vitest";
import { filterComputers, getFilterOptions } from "./catalogFilters.js";

const computers = [
  { id: "study", name: "Notebook Study 14", ramGb: 8, gpu: "Intel UHD Graphics", processor: "Intel Core i5-1235U" },
  { id: "gaming", name: "Notebook Gaming 15", ramGb: 16, gpu: "NVIDIA GeForce RTX 4050", processor: "AMD Ryzen 5 7535HS" },
  { id: "creator", name: "Desktop Creator", ramGb: 32, gpu: "NVIDIA GeForce RTX 4060", processor: "Intel Core i7-14700F" },
];

const base = { search: "", minRam: "", gpu: "", processor: "" };
const ids = (items) => items.map((computer) => computer.id);

it("builds unique, sorted filter choices from API data", () => {
  const options = getFilterOptions([...computers, computers[0]]);
  expect(options.ram).toEqual([8, 16, 32]);
  expect(options.gpus).toHaveLength(3);
  expect(options.processors).toHaveLength(3);
});

it("searches by name, GPU or processor without case sensitivity", () => {
  expect(ids(filterComputers(computers, { ...base, search: "  rTx " }))).toEqual(["gaming", "creator"]);
  expect(ids(filterComputers(computers, { ...base, search: "RyZeN" }))).toEqual(["gaming"]);
});

it("applies minimum RAM and exact GPU and processor filters together", () => {
  expect(ids(filterComputers(computers, {
    ...base, minRam: "16", gpu: "NVIDIA GeForce RTX 4050", processor: "AMD Ryzen 5 7535HS",
  }))).toEqual(["gaming"]);
});

it("returns an empty list when no computers match", () => {
  expect(filterComputers(computers, { ...base, minRam: "32", search: "study" })).toEqual([]);
});

it("returns all computers when filters are cleared", () => {
  expect(ids(filterComputers(computers, base))).toEqual(["study", "gaming", "creator"]);
});
