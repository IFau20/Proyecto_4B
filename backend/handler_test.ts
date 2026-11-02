import { deepStrictEqual as assertEquals } from "node:assert/strict";
import { handleRequest } from "./handler.ts";

Deno.test("GET /api/computers returns the computer catalog", async () => {
  const response = await handleRequest(new Request("http://localhost:8000/api/computers"));
  const computers = await response.json();

  assertEquals(response.status, 200);
  assertEquals(response.headers.get("content-type"), "application/json; charset=utf-8");
  assertEquals(computers.length, 4);
  assertEquals(Object.keys(computers[0]), ["id", "name", "ramGb", "gpu", "processor", "offers"]);
  for (const computer of computers) {
    assertEquals(computer.offers.length, 3);
    assertEquals(new Set(computer.offers.map((offer: { sourceId: string }) => offer.sourceId)).size, 3);
    assertEquals(computer.offers.every((offer: { priceClp: number }) => Number.isInteger(offer.priceClp) && offer.priceClp > 0), true);
  }
});

Deno.test("OPTIONS responds to the CORS preflight", async () => {
  const response = await handleRequest(new Request("http://localhost:8000/api/computers", { method: "OPTIONS" }));
  assertEquals(response.status, 204);
  assertEquals(response.headers.get("access-control-allow-origin"), "*");
});

Deno.test("an unknown path is not found", async () => {
  const response = await handleRequest(new Request("http://localhost:8000/api/unknown"));
  assertEquals(response.status, 404);
});

Deno.test("an unsupported method is rejected", async () => {
  const response = await handleRequest(new Request("http://localhost:8000/api/computers", { method: "POST" }));
  assertEquals(response.status, 405);
  assertEquals(response.headers.get("allow"), "GET, OPTIONS");
});
