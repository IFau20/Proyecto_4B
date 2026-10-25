import { render, screen } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import App from "./App.jsx";

const sample = {
  id: "study-14",
  name: "Notebook Study 14",
  priceClp: 499990,
  ramGb: 8,
  gpu: "Intel UHD Graphics",
  processor: "Intel Core i5-1235U",
};

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
});

it("shows a loading message while the API request is pending", () => {
  fetch.mockReturnValue(new Promise(() => {}));
  render(<App />);

  expect(screen.getByRole("status")).toHaveTextContent("Cargando computadores");
  expect(fetch).toHaveBeenCalledWith("/api/computers", expect.any(Object));
});

it("shows the computer price, RAM, GPU and processor from the API", async () => {
  fetch.mockResolvedValue({ ok: true, json: async () => [sample] });
  render(<App />);

  expect(await screen.findByRole("heading", { name: "Notebook Study 14" })).toBeInTheDocument();
  expect(screen.getByText("$499.990")).toBeInTheDocument();
  expect(screen.getByText("8 GB")).toBeInTheDocument();
  expect(screen.getByText("Intel UHD Graphics")).toBeInTheDocument();
  expect(screen.getByText("Intel Core i5-1235U")).toBeInTheDocument();
});

it("shows a helpful error when the API request fails", async () => {
  fetch.mockResolvedValue({ ok: false, status: 500 });
  render(<App />);

  expect(await screen.findByRole("alert")).toHaveTextContent("No se pudo cargar el catálogo");
});

it("shows an empty state when the API returns no computers", async () => {
  fetch.mockResolvedValue({ ok: true, json: async () => [] });
  render(<App />);

  expect(await screen.findByText("Todavía no hay computadores disponibles.")).toBeInTheDocument();
});
