# PC Tracker architecture

| Layer | Responsibility |
|---|---|
| React/Vite (`frontend/src`) | Catalog, combined filters, comparisons, history charts, geolocation and local ES/EN translation resources. |
| Shared API (`backend/handler.ts`) | HTTP routes, method/parameter validation, JSON responses and error states. |
| Catalog/adapters (`notebooks.ts`, `liveSources.ts`, `pcFactory.ts`) | Manufacturer identity, allowed retailer lookup and price/stock normalization. |
| Branches (`stores.ts`, `pcFactoryStores.ts`, `branchStock.ts`) | Published addresses/hours and model-specific branch inventory where evidence exists. |
| History (`history.ts`, `solotodoHistory.ts`) | Public source first; separately collected, dated observations as fallback. |
| Authentication (`auth.ts`) | Google/Microsoft OIDC, verified identity, expiring sessions and HttpOnly cookies. |
| Hosted runtime (`api/index.ts`, storage modules) | Same-origin Vercel API, private durable storage and authenticated scheduled collection. |

## Catalog flow

React requests `/api/notebooks?preview=1` for an initial view and `/api/notebooks` in parallel to refresh offers. A valid sessionStorage snapshot lasts five minutes; an empty preview cannot erase a nonempty fresh snapshot. A successful empty full response is a valid empty catalog, while malformed data is an error. Backend catalog caching lasts 15 minutes. Opening a comparison calls `/api/verify-notebook?sku=...`, with ten-minute verification caching and bounded concurrency.

The catalog is an explicit list of manufacturer-identified models, not automatic discovery of the entire market. Public reference prices are separate from directly verified current prices. Adapters validate manufacturer code, currency and amounts. Source requests use allowed commercial links, timeouts and concurrency limits. A highlighted discount must come from the same retailer's current/base price; conditional payment terms are labeled separately.

## History and persistence

`/api/history?sku=...` first requests public observations from the last year after validating the part number. If unavailable, it uses independently collected observations; a small number of models also have attributed archival observations as a final fallback. None of these dated references becomes a current offer.

Local Deno startup collects prices and schedules collection every six hours while the process remains running. Local observations live in ignored `backend/data/price-history.json`; a write queue and temporary-file replacement avoid partial writes. Hosting uses a private Vercel Blob JSON store, with conditional writes and retry on conflicting revisions. Persistent records contain SKU, retailer, price and capture date. Captures less than six hours apart for the same SKU/store are deduplicated; records are bounded.

The hosted scheduler runs once daily, matching the available Hobby cron frequency. Its collection endpoint requires a configured `CRON_SECRET`; missing or incorrect authorization is rejected. A stopped local server cannot collect data, and no collector creates observations for past periods when it was not running. External public history remains attributed to its source.

## Nearby availability

`/api/stores?nearby=1` returns branches and `/api/branch-stock?sku=...` retrieves model inventory. A failed query is not cached as sold out. PC Factory reports approximate branch quantities and a closure indicator; missing evidence means unknown availability.

Visitor coordinates require permission and are processed in the frontend. Confirmed-stock filtering happens before distance ordering and the six-branch limit. Distances are geographic approximations, not routes. `/api/holidays?date=...` distinguishes lookup failure from a date without a holiday. Special opening hours require source evidence; the selected date does not predict future stock.

## Authentication

`/api/auth/login` redirects to the configured provider. `/api/auth/callback` exchanges the code and checks RS256 signature, issuer, audience, authorized party when present, nonce and expiration. Single-use state and PKCE S256 bind the callback to the initiating flow. Credentials remain server-side. Google email is used only when marked verified.

Sessions last at most eight hours. `/api/auth/me` resolves the session; `POST /api/auth/logout` revokes it. Cookies are HttpOnly/SameSite and Secure over HTTPS. Local Deno uses an in-memory session/state store; a restart invalidates those local sessions. Hosting shares expiring session/state records through private durable storage so requests can reach different instances. Expired records cannot authenticate; consuming OAuth state is conditional to prevent replay across instances. Sign-out does not sign the user out of Google/Microsoft elsewhere. Browsing remains public.

## Validation boundaries

Parser and interface tests use controlled fixtures; OIDC tests sign test tokens and substitute provider HTTP responses. Storage tests exercise competing writes and separate handler instances. Live probes only establish what external sources returned at execution time. Neither these tests nor a successful build guarantees future stock, prices or a real Google login without valid provider configuration.
