// Configurable Google or Microsoft OpenID Connect authorization-code login with PKCE.
import { readEnv } from "./runtime.ts";
import { JsonConflictError, MemoryJsonStore, type JsonStore } from "./jsonStore.ts";
import { runtimeJsonStore } from "./runtimeStore.ts";
const enc = new TextEncoder();
type AuthSettings = {provider?:string;tenant:string;client:string;secret:string;origin:string;redirect:string};
export const settings = ():AuthSettings => {
 const provider=readEnv("AUTH_PROVIDER") || (readEnv("GOOGLE_CLIENT_ID") ? "google" : "microsoft");
 return {
  provider,
  tenant: readEnv("MICROSOFT_TENANT_ID"),
  client: readEnv(provider==="google" ? "GOOGLE_CLIENT_ID" : "MICROSOFT_CLIENT_ID"),
  secret: readEnv(provider==="google" ? "GOOGLE_CLIENT_SECRET" : "MICROSOFT_CLIENT_SECRET"),
  origin: readEnv("APP_PUBLIC_ORIGIN") || "http://localhost:5173",
  redirect: readEnv("AUTH_REDIRECT_URI") || "http://localhost:8000/api/auth/callback",
 };
};
const providerOf=(s:AuthSettings)=>s.provider ?? "microsoft";
const endpoints=(s:AuthSettings)=>providerOf(s)==="google" ? {
 authorization:"https://accounts.google.com/o/oauth2/v2/auth",
 token:"https://oauth2.googleapis.com/token",keys:"https://www.googleapis.com/oauth2/v3/certs",
} : {
 authorization:"https://login.microsoftonline.com/"+s.tenant+"/oauth2/v2.0/authorize",
 token:"https://login.microsoftonline.com/"+s.tenant+"/oauth2/v2.0/token",
 keys:"https://login.microsoftonline.com/"+s.tenant+"/discovery/v2.0/keys",
};
const guid=(value:string)=>/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)&&
  value!=="00000000-0000-0000-0000-000000000000";
const enabled = (s:AuthSettings) => !!s.secret.trim() && (
 providerOf(s)==="google" ? /^[A-Za-z0-9_-]+\.apps\.googleusercontent\.com$/.test(s.client) :
 providerOf(s)==="microsoft" && guid(s.tenant)&&guid(s.client));
const base64 = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const random = () => base64(crypto.getRandomValues(new Uint8Array(32)));
function decode(text: string) {
  const value = text.replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(value + "=".repeat((4 - value.length % 4) % 4)), c => c.charCodeAt(0));
}
const cookie = (request: Request, name: string) =>
  (request.headers.get("cookie") || "").split(";").map(x => x.trim())
    .find(x => x.startsWith(name + "="))?.slice(name.length + 1) || "";
const cookieHeader = (name: string, value: string, request: Request, age: number) =>
  name + "=" + value + "; HttpOnly; SameSite=Lax; Path=/; Max-Age=" + age +
  (new URL(request.url).protocol === "https:" ? "; Secure" : "");
const seconds = () => Math.floor(Date.now() / 1000);
const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store", ...headers } });

export async function verifyIdToken(jwt: string, s: ReturnType<typeof settings>, nonce: string, fetcher:typeof fetch=fetch) {
  const parts = jwt.split(".");
  if (parts.length !== 3) throw Error("Invalid JWT");
  const header = JSON.parse(new TextDecoder().decode(decode(parts[0])));
  const claims = JSON.parse(new TextDecoder().decode(decode(parts[1])));
  const validIssuer = providerOf(s)==="google"
    ? ["https://accounts.google.com","accounts.google.com"].includes(claims.iss)
    : claims.iss==="https://login.microsoftonline.com/" + s.tenant + "/v2.0";
  if (header.alg !== "RS256" || typeof header.kid !== "string" ||
      !validIssuer || claims.aud !== s.client || (claims.azp !== undefined && claims.azp !== s.client) || claims.nonce !== nonce ||
      typeof claims.exp !== "number" || claims.exp <= seconds() ||
      typeof claims.sub !== "string" || !claims.sub) throw Error("Invalid claims");
  const response = await fetcher(endpoints(s).keys,{signal:AbortSignal.timeout(10000),redirect:"error"});
  if (!response.ok) throw Error("Unable to verify issuer");
  const keys = (await response.json()).keys;
  const jwk = keys?.find((item: { kid: string; kty: string }) => item.kid === header.kid && item.kty === "RSA");
  if (!jwk) throw Error("Unknown signing key");
  const publicKey = await crypto.subtle.importKey("jwk", jwk,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
  const valid = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", publicKey,
    decode(parts[2]), enc.encode(parts[0] + "." + parts[1]));
  if (!valid) throw Error("Invalid JWT signature");
  return claims;
}

type Pending = { verifier: string; nonce: string; expires: number };
type Session = { name: string; email: string | null; expires: number };
const recordKey=(kind:"state"|"session",token:string)=>
 /^[A-Za-z0-9_-]{43}$/.test(token)?"auth/"+kind+"/"+token+".json":null;

export function createAuthHandler(configuration:()=>ReturnType<typeof settings>=settings,fetcher:typeof fetch=fetch,storage?:JsonStore){
 const localStore = new MemoryJsonStore();
 const getStore=async()=>storage ?? await runtimeJsonStore() ?? localStore;
 return async function handleAuth(request: Request): Promise<Response | null> {
  const pathname = new URL(request.url).pathname;
  if (!pathname.startsWith("/api/auth/")) return null;
  const s = configuration();
  const store=await getStore();
  if (pathname === "/api/auth/me" && request.method === "GET") {
    const key=recordKey("session",cookie(request,"pct_session"));
    const session=key?(await store.get<Session>(key))?.value:null;
    return json({ enabled: enabled(s), provider:providerOf(s), loginUrl: new URL("/api/auth/login", s.redirect).href, user: session && session.expires > seconds()
      ? { name: session.name, email: session.email } : null });
  }
  if (pathname === "/api/auth/login" && request.method === "GET") {
    if (!enabled(s)) return json({ error: "Configure the selected SSO provider first" }, 503);
    const state = random(), nonce = random(), verifier = random();
    const hash = await crypto.subtle.digest("SHA-256", enc.encode(verifier));
    await store.put(recordKey("state",state)!, { verifier, nonce, expires: seconds() + 600 },null);
    const authUrl = new URL(endpoints(s).authorization);
    const values = {
      client_id: s.client, response_type: "code", redirect_uri: s.redirect,
      response_mode: "query", scope: "openid profile email", state, nonce,
      code_challenge: base64(new Uint8Array(hash)), code_challenge_method: "S256",
    };
    for (const [key, value] of Object.entries(values)) authUrl.searchParams.set(key, value);
    return new Response(null, { status: 302, headers: {
      Location: authUrl.href, "Set-Cookie": cookieHeader("pct_state", state, request, 600),
      "Cache-Control": "no-store",
    } });
  }
  if (pathname === "/api/auth/callback" && request.method === "GET") {
    const url = new URL(request.url);
    const state = url.searchParams.get("state") || "", code = url.searchParams.get("code") || "";
    const key=recordKey("state",state);
    if (!enabled(s) || !key || !code || state !== cookie(request, "pct_state"))
      return json({ error: "Invalid login state" }, 400);
    const pending=await store.get<Pending>(key);
    if(!pending)return json({ error: "Invalid login state" }, 400);
    try{await store.remove(key,pending.etag);}
    catch(error){if(error instanceof JsonConflictError)return json({ error: "Invalid login state" },400);throw error;}
    const challenge=pending.value;
    if(challenge.expires<=seconds())return json({ error: "Invalid login state" },400);
    try {
      const body = new URLSearchParams({
        client_id: s.client, client_secret: s.secret, grant_type: "authorization_code",
        code, redirect_uri: s.redirect, code_verifier: challenge.verifier,
      });
      const response = await fetcher(endpoints(s).token, {
        signal:AbortSignal.timeout(10000),redirect:"error",
        method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body,
      });
      if (!response.ok) throw Error("Authorization code failed");
      const tokens = await response.json();
      const claims = await verifyIdToken(tokens.id_token, s, challenge.nonce,fetcher);
      const token = random();
      await store.put(recordKey("session",token)!, {
        name: String(claims.name || claims.preferred_username || "User"),
        email: providerOf(s)==="google"
          ? (claims.email_verified===true && typeof claims.email==="string" ? claims.email : null)
          : (typeof claims.preferred_username === "string" ? claims.preferred_username : null),
        expires: seconds() + 28800,
      },null);
      return new Response(null, { status: 302, headers: {
        Location: s.origin, "Set-Cookie": cookieHeader("pct_session", token, request, 28800),
        "Cache-Control": "no-store",
      } });
    } catch { return json({ error: "Could not validate SSO login" }, 401); }
  }
  if (pathname === "/api/auth/logout" && request.method === "POST") {
    const origin = request.headers.get("Origin");
    if (origin && origin !== s.origin) return json({ error: "Invalid origin" }, 403);
    const key=recordKey("session",cookie(request,"pct_session"));
    if(key){
      const session=await store.get<Session>(key);
      if(session)try{await store.remove(key,session.etag);}
      catch(error){if(!(error instanceof JsonConflictError))throw error;}
    }
    return json({ ok: true }, 200, {
      "Set-Cookie": cookieHeader("pct_session", "", request, 0),
    });
  }
  return json({ error: "Not found" }, 404);
 };
}
export const handleAuth=createAuthHandler();
