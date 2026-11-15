import { strictEqual as equal } from "node:assert/strict";
import { handleAuth } from "./auth.ts";
Deno.test("unauthenticated user endpoint does not require Entra credentials", async () => {
 const res = await handleAuth(new Request("http://localhost:8000/api/auth/me"));
 equal(res?.status, 200);
 equal((await res?.json()).user, null);
});
Deno.test("rejects callbacks without a state token", async () => {
 const res = await handleAuth(new Request("http://localhost:8000/api/auth/callback"));
 equal(res?.status, 400);
});
Deno.test("rejects invalid auth routes", async () => {
 const res = await handleAuth(new Request("http://localhost:8000/api/auth/unrecognized"));
 equal(res?.status, 404);
});

Deno.test("login URL uses the backend origin so OAuth state cookies survive the redirect", async () => {
 const res=await handleAuth(new Request("http://localhost:8000/api/auth/me"));
 const payload=await res?.json();
 equal(payload.loginUrl,"http://localhost:8000/api/auth/login");
});
