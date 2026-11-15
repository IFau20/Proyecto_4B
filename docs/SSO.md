# Microsoft Entra ID SSO

OIDC authorization-code login is implemented with a confidential client, PKCE, nonce, single-use state, 10-minute callback expiry, Microsoft RS256 JWKS validation, issuer/audience/expiration checks, SameSite=Lax HttpOnly session cookies and server logout.

To enable it, register an app in the institutional Microsoft Entra tenant:
1. Create a **Web** application and register the local redirect URI \`http://localhost:8000/api/auth/callback\`.
2. Create a client secret and set \`MICROSOFT_TENANT_ID\`, \`MICROSOFT_CLIENT_ID\` and \`MICROSOFT_CLIENT_SECRET\` in the backend environment, plus \`APP_PUBLIC_ORIGIN=http://localhost:5173\` and \`AUTH_REDIRECT_URI=http://localhost:8000/api/auth/callback\`.
3. Start Deno. \`GET /api/auth/login\` begins SSO; \`GET /api/auth/me\` returns the profile and \`POST /api/auth/logout\` ends the session.

Without institutional credentials, SSO is intentionally unavailable and the UI must explain this. Real end-to-end sign-in cannot be tested without an app registered by the owner. The session store is in memory and does not survive restarts. Use HTTPS and a shared session database before a multi-instance production deployment.

AI assistance: ChatGPT (OpenAI).
