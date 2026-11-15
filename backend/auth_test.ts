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

Deno.test("configured Microsoft SSO completes code exchange, signed-token validation, session and logout",async()=>{
 const {createAuthHandler}=await import("./auth.ts");
 const config={tenant:"11111111-1111-1111-1111-111111111111",client:"22222222-2222-2222-2222-222222222222",secret:"test-only-secret",origin:"http://localhost:5173",redirect:"http://localhost:8000/api/auth/callback"};
 const keys=await crypto.subtle.generateKey({name:"RSASSA-PKCS1-v1_5",modulusLength:2048,publicExponent:new Uint8Array([1,0,1]),hash:"SHA-256"},true,["sign","verify"]);
 const jwk=await crypto.subtle.exportKey("jwk",keys.publicKey);
 const b64=(s:Uint8Array)=>btoa(String.fromCharCode(...s)).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
 const encode=(obj:unknown)=>b64(new TextEncoder().encode(JSON.stringify(obj)));
 let nonce="";let verifierValid=false;
 const auth=createAuthHandler(()=>config,(async(url,init)=>{
  if(String(url).endsWith("/token")){
   const body=init?.body as URLSearchParams;
   equal(body.get("code"),"test-authorization-code");equal(body.get("client_secret"),"test-only-secret");
   verifierValid=!!body.get("code_verifier");
   const head=encode({alg:"RS256",kid:"test-key"});
   const claims=encode({iss:"https://login.microsoftonline.com/"+config.tenant+"/v2.0",aud:config.client,nonce,exp:Math.floor(Date.now()/1000)+600,sub:"test-subject",name:"Test User",preferred_username:"test@example.invalid"});
   const signed=head+"."+claims;
   const signature=await crypto.subtle.sign("RSASSA-PKCS1-v1_5",keys.privateKey,new TextEncoder().encode(signed));
   return Response.json({id_token:signed+"."+b64(new Uint8Array(signature))});
  }
  if(String(url).endsWith("/keys"))return Response.json({keys:[{...jwk,kid:"test-key"}]});
  throw Error("Unexpected Microsoft endpoint");
 }) as typeof fetch);
 const login=(await auth(new Request("http://localhost:8000/api/auth/login")))!;
 equal(login.status,302);
 const redirect=new URL(login.headers.get("Location")!);nonce=redirect.searchParams.get("nonce")!;
 const cookie=login.headers.get("Set-Cookie")!.split(";")[0];
 equal(redirect.searchParams.get("code_challenge_method"),"S256");
 const callbackUrl="http://localhost:8000/api/auth/callback?code=test-authorization-code&state="+redirect.searchParams.get("state");
 const callback=(await auth(new Request(callbackUrl,{headers:{Cookie:cookie}})))!;
 equal(callback.status,302);equal(verifierValid,true);
 const session=callback.headers.get("Set-Cookie")!.split(";")[0];
 equal(callback.headers.get("Set-Cookie")!.includes("HttpOnly"),true);
 const me=(await auth(new Request("http://localhost:8000/api/auth/me",{headers:{Cookie:session}})))!;
 equal((await me.json()).user.email,"test@example.invalid");
 equal((await auth(new Request(callbackUrl,{headers:{Cookie:cookie}})))!.status,400);
 const forbidden=(await auth(new Request("http://localhost:8000/api/auth/logout",{method:"POST",headers:{Cookie:session,Origin:"https://evil.invalid"}})))!;
 equal(forbidden.status,403);
 await auth(new Request("http://localhost:8000/api/auth/logout",{method:"POST",headers:{Cookie:session,Origin:config.origin}}));
 const loggedOut=(await auth(new Request("http://localhost:8000/api/auth/me",{headers:{Cookie:session}})))!;
 equal((await loggedOut.json()).user,null);
});
Deno.test("malformed tenant or client identifiers do not enable Microsoft login",async()=>{
 const {createAuthHandler}=await import("./auth.ts");
 const auth=createAuthHandler(()=>({tenant:"------------------------------------",client:"22222222-2222-2222-2222-222222222222",secret:"secret",origin:"http://localhost:5173",redirect:"http://localhost:8000/api/auth/callback"}));
 const response=(await auth(new Request("http://localhost:8000/api/auth/me")))!;
 equal((await response.json()).enabled,false);
});
