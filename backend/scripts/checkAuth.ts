import {handleAuth,settings} from "../auth.ts";
const configuration=settings();
const response=await handleAuth(new Request("http://localhost:8000/api/auth/me"));
const status=await response!.json();
const google=status.provider==="google";
const required=google ? [["GOOGLE_CLIENT_ID",configuration.client],["GOOGLE_CLIENT_SECRET",configuration.secret]] : [
 ["MICROSOFT_TENANT_ID",configuration.tenant],["MICROSOFT_CLIENT_ID",configuration.client],["MICROSOFT_CLIENT_SECRET",configuration.secret]
];
const missing=required.filter(([,value])=>!value.trim()).map(([name])=>name);
console.log(JSON.stringify({provider:status.provider,configured:status.enabled,missing,
 callbackUrl:configuration.redirect,appUrl:configuration.origin,
 nextStep:status.enabled?"Start PC Tracker and complete a real sign-in.":google?
  "Register a Google OAuth Web application, then run scripts/configure-google-sso.ps1.":
  "Register a Microsoft Entra Web application, then run scripts/configure-sso.ps1."
},null,2));
if(!status.enabled)Deno.exit(1);
