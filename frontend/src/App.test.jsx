import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import App from "./App.jsx";

const sample = {
  id: "study-14",
  name: "Notebook Study 14",
  ramGb: 8,
  gpu: "Intel UHD Graphics",
  processor: "Intel Core i5-1235U",
  offers: [
    { sourceId: "demo-a", sourceName: "Fuente de prueba A", priceClp: 529990 },
    { sourceId: "demo-b", sourceName: "Fuente de prueba B", priceClp: 499990 },
    { sourceId: "demo-c", sourceName: "Fuente de prueba C", priceClp: 514990 },
  ],
};

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
  window.localStorage.clear();
  document.documentElement.removeAttribute("data-theme");
});

it("shows a loading message while the API request is pending", () => {
  fetch.mockReturnValue(new Promise(() => {}));
  render(<App />);

  expect(screen.getByRole("status")).toHaveTextContent("Cargando computadores");
  expect(fetch).toHaveBeenCalledWith("/api/computers", expect.any(Object));
});

it("shows the lowest computer price, RAM, GPU and processor from the API", async () => {
  fetch.mockResolvedValue({ ok: true, json: async () => [sample] });
  render(<App />);

  expect(await screen.findByRole("heading", { name: "Notebook Study 14" })).toBeInTheDocument();
  expect(screen.getByText("$499.990")).toBeInTheDocument();
  expect(screen.getByText("8 GB")).toBeInTheDocument();
  expect(screen.getAllByText("Intel UHD Graphics").length).toBeGreaterThan(0);
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

it("searches computers by name without case sensitivity", async () => {
  fetch.mockResolvedValue({ ok: true, json: async () => [
    sample,
    { ...sample, id: "gaming-15", name: "Notebook Gaming 15" },
  ] });
  render(<App />);
  await screen.findByRole("heading", { name: "Notebook Gaming 15" });

  fireEvent.change(screen.getByRole("searchbox", { name: "Buscar computador" }), {
    target: { value: "GAMING" },
  });

  expect(screen.queryByRole("heading", { name: "Notebook Study 14" })).not.toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Notebook Gaming 15" })).toBeInTheDocument();
  expect(screen.getByText("1 de 2 equipos")).toBeInTheDocument();
});

it("combines RAM and GPU filters and resets them", async () => {
  fetch.mockResolvedValue({ ok: true, json: async () => [
    sample,
    { ...sample, id: "gaming-15", name: "Notebook Gaming 15", ramGb: 16, gpu: "NVIDIA GeForce RTX 4050", processor: "AMD Ryzen 5 7535HS" },
  ] });
  render(<App />);
  await screen.findByRole("heading", { name: "Notebook Gaming 15" });

  fireEvent.change(screen.getByLabelText("RAM mínima"), { target: { value: "16" } });
  fireEvent.change(screen.getByLabelText("GPU"), { target: { value: "NVIDIA GeForce RTX 4050" } });
  expect(screen.queryByRole("heading", { name: "Notebook Study 14" })).not.toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Notebook Gaming 15" })).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: "Limpiar filtros" }));
  expect(screen.getByRole("heading", { name: "Notebook Study 14" })).toBeInTheDocument();
  expect(screen.getByText("2 de 2 equipos")).toBeInTheDocument();
});

it("shows a no-match state when search has no matches", async () => {
  fetch.mockResolvedValue({ ok: true, json: async () => [sample] });
  render(<App />);
  await screen.findByRole("heading", { name: "Notebook Study 14" });

  fireEvent.change(screen.getByRole("searchbox", { name: "Buscar computador" }), {
    target: { value: "unavailable-model" },
  });

  expect(screen.getByText("No encontramos computadores con esos filtros.")).toBeInTheDocument();
  expect(screen.queryByRole("heading", { name: "Notebook Study 14" })).not.toBeInTheDocument();
});

it("shows PC Tracker as the application name", () => {
  fetch.mockReturnValue(new Promise(() => {}));
  render(<App />);

  expect(screen.getByRole("link", { name: "PC Tracker, ir al inicio" })).toBeInTheDocument();
});

it("expands and collapses the price comparison for three sources", async () => {
  fetch.mockResolvedValue({ ok: true, json: async () => [sample] });
  render(<App />);
  await screen.findByRole("heading", { name: "Notebook Study 14" });

  const compareButton = screen.getByRole("button", { name: "Comparar precios (3 fuentes)" });
  expect(compareButton).toHaveAttribute("aria-expanded", "false");
  fireEvent.click(compareButton);

  expect(screen.getByRole("button", { name: "Ocultar comparación" })).toHaveAttribute("aria-expanded", "true");
  expect(screen.getByText("Fuente de prueba A")).toBeInTheDocument();
  expect(screen.getByText("Fuente de prueba B")).toBeInTheDocument();
  expect(screen.getByText("Fuente de prueba C")).toBeInTheDocument();
  expect(screen.getByText("$30.000")).toBeInTheDocument();
  expect(screen.getByText("Menor precio")).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: "Ocultar comparación" }));
  expect(screen.queryByText("Fuente de prueba A")).not.toBeInTheDocument();
});

it("handles a computer without valid offers without crashing", async () => {
  fetch.mockResolvedValue({ ok: true, json: async () => [{ ...sample, offers: [] }] });
  render(<App />);

  expect(await screen.findByText("Sin precios")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Comparar precios (0 fuentes)" })).toBeDisabled();
});

it("toggles dark mode and persists the choice", () => {
  fetch.mockReturnValue(new Promise(() => {}));
  render(<App />);

  const enableDark = screen.getByRole("button", { name: "Activar modo oscuro" });
  expect(enableDark).toHaveAttribute("aria-pressed", "false");

  fireEvent.click(enableDark);
  expect(document.documentElement).toHaveAttribute("data-theme", "dark");
  expect(window.localStorage.getItem("pc-tracker-theme")).toBe("dark");
  expect(screen.getByRole("button", { name: "Activar modo claro" })).toHaveAttribute("aria-pressed", "true");

  fireEvent.click(screen.getByRole("button", { name: "Activar modo claro" }));
  expect(document.documentElement).toHaveAttribute("data-theme", "light");
  expect(window.localStorage.getItem("pc-tracker-theme")).toBe("light");
});

it("restores the stored dark preference on the next visit", () => {
  window.localStorage.setItem("pc-tracker-theme", "dark");
  fetch.mockReturnValue(new Promise(() => {}));
  render(<App />);

  expect(document.documentElement).toHaveAttribute("data-theme", "dark");
  expect(screen.getByRole("button", { name: "Activar modo claro" })).toBeInTheDocument();
});

it("explains when only one retailer price is verified instead of showing a false $0 difference", async () => {
  const live = {
    id: "loq-real", name: "Lenovo LOQ Real", ramGb: 24,
    gpu: "RTX 4050", processor: "Ryzen 7 7435HS", isLive: true,
    verification: { totalSources: 3, verifiedPrices: 1, verifiedStocks: 1, comparable: false, stockComplete: false },
    offers: [
      { sourceId: "a", sourceName: "Centrale", priceClp: null, availability: "out_of_stock", checkedAt: "2026-11-09T12:00:00Z" },
      { sourceId: "b", sourceName: "SP Digital", priceClp: 1449170, availability: "unknown", checkedAt: "2026-11-09T12:00:00Z" },
      { sourceId: "c", sourceName: "Winpy", priceClp: null, availability: "unknown", queryStatus: "blocked", checkedAt: "2026-11-09T12:00:00Z" },
    ],
  };
  fetch.mockImplementation(async (url) => ({ ok: true, json: async () => url === "/api/live-comparisons" ? live : [sample] }));
  render(<App />);
  await screen.findByRole("heading", { name: "Lenovo LOQ Real" });
  expect(screen.getByText("1 de 3 precios verificados")).toBeInTheDocument();
  expect(screen.getByText(/Consulta de tiendas: 1 de 3 precios verificados/)).toBeInTheDocument();
  const buttons = screen.getAllByRole("button", { name: "Comparar precios (3 fuentes)" });
  fireEvent.click(buttons[0]);
  expect(screen.getByText("Se necesitan dos precios verificados")).toBeInTheDocument();
  expect(screen.getByText("Tienda bloqueó la consulta")).toBeInTheDocument();
  expect(screen.getByText("Stock publicado: agotado")).toBeInTheDocument();
});
