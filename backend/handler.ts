import { getLiveProduct } from "./liveSources.ts";
import { readHistory, saveObservations, summarizePriceHistory } from "./history.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function handleRequest(request: Request): Promise<Response> {
  const { pathname } = new URL(request.url);

  if (pathname !== "/api/computers" && pathname !== "/api/live-comparisons" && pathname !== "/api/history") {
    return new Response("Not found", { status: 404, headers: corsHeaders });
  }

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (request.method !== "GET") {
    return new Response("Method not allowed", {
      status: 405,
      headers: { ...corsHeaders, Allow: "GET, OPTIONS" },
    });
  }

  if (pathname === "/api/live-comparisons") {
    const computer = await getLiveProduct();
    try {
      await saveObservations(computer.sku, computer.offers);
    } catch (error) {
      console.error("Unable to persist observed prices", error);
    }
    return Response.json(computer, { headers: corsHeaders });
  }

  if (pathname === "/api/history") {
    const sku = new URL(request.url).searchParams.get("sku") ?? "";
    if (!/^[\w-]{1,100}$/.test(sku)) {
      return Response.json({ error: "Invalid SKU" }, { status: 400, headers: corsHeaders });
    }
    try {
      return Response.json(summarizePriceHistory(await readHistory(), sku), { headers: corsHeaders });
    } catch (error) {
      console.error("Unable to read history", error);
      return Response.json({ error: "History storage unavailable" }, { status: 503, headers: corsHeaders });
    }
  }

  try {
    const contents = await Deno.readTextFile(new URL("./data/computers.json", import.meta.url));
    return new Response(contents, {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
    });
  } catch {
    return new Response("Unable to load computers", { status: 500, headers: corsHeaders });
  }
}
