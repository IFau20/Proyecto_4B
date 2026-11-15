# Rubric completion implementation plan

Goal: finish the existing 4B application using the project PDF and the verified gaps from b20bdbf.
Architecture: preserve React/Vite and Deno; retain distinctions between direct and published evidence. Do not generate prices, stock, history or opening hours.

1. Calendar: regression tests for upstream failure/malformed data, then report calendar_unavailable instead of silently treating failure as an ordinary day.
2. Nearby availability: regression tests for available branches beyond the nearest six, empty/error states and SKU changes. Filter confirmed inventory before limiting distance results; offer an explicit view of unverified branches.
3. Retail data: inspect live HTML/JSON. Verify public retailer URLs against exact SKU and supported hostnames with bounded concurrency. Add per-location stock only when branch evidence is explicit. Parse published weekly hours; retain source/time and unknown special schedules.
4. SSO and demonstration: validate configurable Microsoft login, failure and cookie behavior; preserve external setup requirement. Verify ES/EN and responsive flows using the running app.
5. Run backend/frontend tests, build and live diagnostics; review diff, update compliance evidence and commit/push develop. Keep main unchanged.

Review focus: source failure must remain unknown; unrelated product data cannot prove inventory; selection changes cannot show prior SKU data; unlocated branches cannot be distance sorted; unconfigured SSO must be documented without a fake login.

## Execution record

- Calendar regression tests failed first, then passed with explicit unavailable status and malformed-response rejection.
- Nearby filter regression failed first; confirmed inventory is filtered before the distance limit. React integration covers HTTP/network errors and unknown-stock inclusion.
- Public PC Factory endpoints and dynamically discovered store widget verified with live responses. No authentication or cart endpoints used.
- On-demand verification obtained four directly checked retailer prices for D0CJ4LA.
- Independent review: all five important findings reproduced with failing tests, fixed, and full suites passed (100 backend / 45 frontend).
- SSO production sign-in remains externally blocked by missing institutional app registration. Existing implementation retained; no fake login created.
- Visual browser verification blocked by execution-environment limitations; component tests and production build passed.
- Publication: develop only; main remains unchanged.
