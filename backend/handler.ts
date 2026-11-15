import { getNotebooks, getFreshNotebooks, getNotebookPreview } from "./notebooks.ts";
import { getHpProduct } from "./hpSources.ts";
import { handleAuth } from "./auth.ts";
import { getLiveProduct } from "./liveSources.ts";
import { readHistory, saveObservations, summarizePriceHistory } from "./history.ts";
import { getStores } from "./stores.ts";
import {holidayOn,validChileanDate} from "./holidays.ts";
import { geocodeStoreLocations } from "./storeGeocoding.ts";
import { proxyNotebookImage } from "./images.ts";
import { NOTEBOOKS } from "./notebooks.ts";
import { historyWithFallback } from "./solotodoHistory.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function handleRequest(request: Request): Promise<Response> {
  const authResponse = await handleAuth(request);
  if (authResponse) return authResponse;
  const { pathname } = new URL(request.url);

  if (pathname !== "/api/notebooks" && pathname !== "/api/live-comparisons" && pathname !== "/api/live-comparisons-hp" && pathname !== "/api/history" && pathname !== "/api/stores" && pathname !== "/api/notebook-image" && pathname !== "/api/holidays") {
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

  if (pathname === "/api/live-comparisons-hp") {
    const computer=await getHpProduct();
    try { await saveObservations(computer.sku,computer.offers); }
    catch (error) { console.error("Unable to persist HP price history",error); }
    return Response.json(computer,{headers:corsHeaders});
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

  if (pathname === "/api/notebook-image") {
    const sku=new URL(request.url).searchParams.get("sku")??"";
    if(!/^[A-Za-z0-9_.#-]{1,100}$/.test(sku))return new Response("Invalid SKU",{status:400});
    return proxyNotebookImage(sku,getNotebookPreview());
  }

  if (pathname === "/api/stores") {
    const result=await getStores();
    const geocode=new URL(request.url).searchParams.get("nearby")==="1";
    return Response.json(geocode?await geocodeStoreLocations(result):result,{headers:corsHeaders});
  }

  if (pathname === "/api/holidays") {
    const date=new URL(request.url).searchParams.get("date")??"";
    if(!validChileanDate(date))return Response.json({error:"Invalid date"},{status:400,headers:corsHeaders});
    try{return Response.json({date,holiday:await holidayOn(date)},
      {headers:{...corsHeaders,"Cache-Control":"public, max-age=3600"}});}
    catch{return Response.json({date,holiday:null,status:"calendar_unavailable"},{headers:corsHeaders});}
  }

  if (pathname === "/api/history") {
    const sku = new URL(request.url).searchParams.get("sku") ?? "";
    if (!/^[A-Za-z0-9_.#-]{1,100}$/.test(sku)) {
      return Response.json({ error: "Invalid SKU" }, { status: 400, headers: corsHeaders });
    }
    try {
      const notebook=NOTEBOOKS.find(n=>n.sku===sku);
      return Response.json(await historyWithFallback(sku,notebook && "profileUrl" in notebook ? notebook.profileUrl : null),{headers:corsHeaders});
    } catch (error) {
      console.error("Unable to read history", error);
      return Response.json({ error: "History storage unavailable" }, { status: 503, headers: corsHeaders });
    }
  }

  if (pathname === "/api/notebooks") {
    try {
      const mode=new URL(request.url).searchParams;
      const notebooks=mode.get("preview")==="1"
        ?getNotebookPreview()
        :await getFreshNotebooks();
      return Response.json(notebooks,{headers:{
        ...corsHeaders,
        "Cache-Control":mode.has("fresh")?"no-store":"private, max-age=30",
        "X-Catalog-Mode":mode.get("preview")==="1"?"preview":"full"
      }});
    } catch (error) {
      console.error("Notebook catalog unavailable", error);
      return Response.json({error:"Catalog unavailable"},{status:503,headers:corsHeaders});
    }
  }
  return new Response("Not found", {status:404,headers:corsHeaders});
}
