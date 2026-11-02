import { fireEvent, render, screen } from "@testing-library/react";
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
