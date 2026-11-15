# Price coverage, branch discovery and SSO completion

Continue from 1113a59 on develop. Preserve exact manufacturer identities, truthful stock states, original stack and main.

1. Reproduce premature branch lookup and cache behavior. Resolve current product listings before caching a stock result; do not cache network failure or absence of discovery as verified empty inventory. Inject discovery for isolated tests; share concurrent work.
2. Audit all catalog identities against public offers. Search exact SKUs lacking coverage on the web, add attributable retailer links, verify them and report any historical-only or unavailable models explicitly. Do not merge different laptop configurations.
3. Make SSO configuration load automatically from ignored backend/.env, add a Windows configuration command and validate the full login/callback/session/logout flow with signed test tokens and mocked Microsoft network only. No simulated production login. Real institutional registration cannot be invented; identify concrete external blocker after code is ready.
4. Run full suites/build, live coverage audit, independent code review and publish develop.

## Execution record

- Added 25 exact retailer links for 12 models after searching 20 missing product codes. Four remaining missing amounts recovered from public historical records with original dates; never promoted to current offers.
- Stock discovery regression failed then passed. Both branch-level and lower-level partial-response failure caches corrected; physical failures report HTTP 503.
- Added automatic .env loading, masked PowerShell configurator and auth:status. End-to-end code flow verifies a signed test token, cookies and logout using injected Microsoft network responses; production still requires real Entra registration.
- Independent review found partial PC Factory cache and visible refurbished-price bypass; both reproduced with failing tests and fixed. No other important findings.
- App registration is an external blocker; no tenant, client or secret exists in this environment. Registration instructions are concrete and no fake login has been introduced.
