import {handleAuth,settings} from "../auth.ts";
const configuration=settings();
const response=await handleAuth(new Request("http://localhost:8000/api/auth/me"));
const status=await response!.json();
const missing=[
 ["MICROSOFT_TENANT_ID",configuration.tenant],
 ["MICROSOFT_CLIENT_ID",configuration.client],
 ["MICROSOFT_CLIENT_SECRET",configuration.secret]
].filter(([,value])=>!value).map(([name])=>name);
console.log(JSON.stringify({configured:status.enabled,missing,
 callbackUrl:configuration.redirect,appUrl:configuration.origin,
 nextStep:status.enabled?"Start PC Tracker and complete a real Microsoft sign-in.":
  "Register a Microsoft Entra Web application, then run scripts/configure-sso.ps1."
},null,2));
if(!status.enabled)Deno.exit(1);
