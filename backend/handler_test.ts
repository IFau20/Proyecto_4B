import { deepStrictEqual as assertEquals } from "node:assert/strict";
import { handleRequest } from "./handler.ts";

Deno.test("GET /api/notebooks endpoint accepts the catalog route", async () => {
  const request = new Request("http://localhost:8000/api/notebooks", {method:"OPTIONS"});
  const response = await handleRequest(request);
  assertEquals(response.status, 204);
});

Deno.test("OPTIONS responds to the CORS preflight", async () => {
  const response = await handleRequest(new Request("http://localhost:8000/api/notebooks", { method: "OPTIONS" }));
  assertEquals(response.status, 204);
  assertEquals(response.headers.get("access-control-allow-origin"), "*");
});

Deno.test("an unknown path is not found", async () => {
  const response = await handleRequest(new Request("http://localhost:8000/api/unknown"));
  assertEquals(response.status, 404);
});

Deno.test("an unsupported method is rejected", async () => {
  const response = await handleRequest(new Request("http://localhost:8000/api/notebooks", { method: "POST" }));
  assertEquals(response.status, 405);
  assertEquals(response.headers.get("allow"), "GET, OPTIONS");
});
