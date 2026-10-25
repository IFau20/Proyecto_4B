const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function handleRequest(request: Request): Promise<Response> {
  const { pathname } = new URL(request.url);

  if (pathname !== "/api/computers") {
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
