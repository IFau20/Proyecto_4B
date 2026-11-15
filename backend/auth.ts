// Configurable Microsoft Entra OpenID Connect authorization-code login with PKCE.
const enc = new TextEncoder();
const readEnv = (name: string) => { try { return Deno.env.get(name) ?? ""; } catch { return ""; } };
const settings = () => ({
  tenant: readEnv("MICROSOFT_TENANT_ID"),
  client: readEnv("MICROSOFT_CLIENT_ID"),
  secret: readEnv("MICROSOFT_CLIENT_SECRET"),
  origin: readEnv("APP_PUBLIC_ORIGIN") || "http://localhost:5173",
  redirect: readEnv("AUTH_REDIRECT_URI") || "http://localhost:8000/api/auth/callback",
});
const enabled = (s: ReturnType<typeof settings>) =>
  /^[\da-f-]{36}$/i.test(s.tenant) && /^[\da-f-]{36}$/i.test(s.client) && !!s.secret;
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
const pending = new Map<string, { verifier: string; nonce: string; expires: number }>();
const sessions = new Map<string, { name: string; email: string | null; expires: number }>();
const seconds = () => Math.floor(Date.now() / 1000);
const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store", ...headers } });

export async function verifyIdToken(jwt: string, s: ReturnType<typeof settings>, nonce: string) {
  const parts = jwt.split(".");
  if (parts.length !== 3) throw Error("Invalid JWT");
  const header = JSON.parse(new TextDecoder().decode(decode(parts[0])));
  const claims = JSON.parse(new TextDecoder().decode(decode(parts[1])));
  const issuer = "https://login.microsoftonline.com/" + s.tenant + "/v2.0";
  if (header.alg !== "RS256" || typeof header.kid !== "string" ||
      claims.iss !== issuer || claims.aud !== s.client || claims.nonce !== nonce ||
      typeof claims.exp !== "number" || claims.exp <= seconds() ||
      typeof claims.sub !== "string" || !claims.sub) throw Error("Invalid claims");
  const response = await fetch("https://login.microsoftonline.com/" + s.tenant + "/discovery/v2.0/keys");
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

export async function handleAuth(request: Request): Promise<Response | null> {
  const pathname = new URL(request.url).pathname;
  if (!pathname.startsWith("/api/auth/")) return null;
  const s = settings();
  if (pathname === "/api/auth/me" && request.method === "GET") {
    const session = sessions.get(cookie(request, "pct_session"));
    return json({ enabled: enabled(s), loginUrl: new URL("/api/auth/login", request.url).href, user: session && session.expires > seconds()
      ? { name: session.name, email: session.email } : null });
  }
  if (pathname === "/api/auth/login" && request.method === "GET") {
    if (!enabled(s)) return json({ error: "Configure Microsoft Entra ID first" }, 503);
    const state = random(), nonce = random(), verifier = random();
    const hash = await crypto.subtle.digest("SHA-256", enc.encode(verifier));
    pending.set(state, { verifier, nonce, expires: seconds() + 600 });
    const authUrl = new URL("https://login.microsoftonline.com/" + s.tenant + "/oauth2/v2.0/authorize");
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
    const challenge = pending.get(state);
    pending.delete(state);
    if (!enabled(s) || !state || !code || state !== cookie(request, "pct_state") ||
        !challenge || challenge.expires < seconds()) return json({ error: "Invalid login state" }, 400);
    try {
      const body = new URLSearchParams({
        client_id: s.client, client_secret: s.secret, grant_type: "authorization_code",
        code, redirect_uri: s.redirect, code_verifier: challenge.verifier,
      });
      const response = await fetch("https://login.microsoftonline.com/" + s.tenant + "/oauth2/v2.0/token", {
        method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body,
      });
      if (!response.ok) throw Error("Authorization code failed");
      const tokens = await response.json();
      const claims = await verifyIdToken(tokens.id_token, s, challenge.nonce);
      const token = random();
      sessions.set(token, {
        name: String(claims.name || claims.preferred_username || "User"),
        email: typeof claims.preferred_username === "string" ? claims.preferred_username : null,
        expires: seconds() + 28800,
      });
      return new Response(null, { status: 302, headers: {
        Location: s.origin, "Set-Cookie": cookieHeader("pct_session", token, request, 28800),
        "Cache-Control": "no-store",
      } });
    } catch { return json({ error: "Could not validate Microsoft login" }, 401); }
  }
  if (pathname === "/api/auth/logout" && request.method === "POST") {
    const origin = request.headers.get("Origin");
    if (origin && origin !== s.origin) return json({ error: "Invalid origin" }, 403);
    sessions.delete(cookie(request, "pct_session"));
    return json({ ok: true }, 200, {
      "Set-Cookie": cookieHeader("pct_session", "", request, 0),
    });
  }
  return json({ error: "Not found" }, 404);
}
