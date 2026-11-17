# PC Tracker — Project 4B

Academic notebook comparison application built with React/Vite and a Deno 2/TypeScript API. The catalog contains 48 manufacturer-identified models. Comparing complete notebooks through their RAM, GPU and CPU follows the scope accepted by the professor.

## Features

- Combined name, RAM, GPU and CPU filters; 12-item pagination.
- Same-model retailer comparison with verified prices, dated references and explicit verification states.
- Per-store price history: public SoloTodo observations and independently collected observations as fallback.
- Online availability and approximate physical branch inventory for compatible PC Factory listings.
- Official branch hours, holiday lookup and up to six nearby branches, optionally restricted to confirmed stock.
- Google OpenID Connect sign-in, with Microsoft as a configurable alternative. Browsing is public.
- Responsive layout, persistent dark mode, Spanish/English resources and browser-language detection. A saved language choice takes precedence.

## Public deployment

Production URL: https://pc-tracker-4b-turbinalred-3964.vercel.app/ . Frontend and API share the same HTTPS origin. Private Blob storage keeps collected history and hosted OAuth state/sessions across function instances. A protected cron collects once daily; local Deno retains its six-hour schedule.

Google sign-in in production requires the owner's Web OAuth credentials and the exact HTTPS callback registered with Google; local credentials are never published automatically.

The Vercel Git integration could not access this repository (`repo_no_access`), so this release is deployed from the reviewed source files. Automatic deployment on push requires granting that integration repository access.

## Local setup

Install Git, Node.js 22.12+ (24 LTS recommended) and Deno 2. In PowerShell:

```powershell
$project = Join-Path $HOME "PCTracker"
if (-not (Test-Path "$project\.git")) {
  git clone --branch main https://github.com/IFau20/Proyecto_4B.git "$project"
}
Set-Location $project
git switch main
git pull --ff-only origin main
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\scripts\start.ps1"
```

Open **http://localhost:5173**. The script installs dependencies and opens separate frontend/backend windows; closing them stops the application. Keep using `localhost` throughout sign-in.

For Google sign-in, create a Web OAuth client with callback `http://localhost:8000/api/auth/callback`, then run:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\scripts\configure-google-sso.ps1"
```

Credentials stay in ignored `backend/.env`. Restart both servers after configuration. Credentials configured on one computer do not automatically transfer to another computer or hosting provider. See [SSO configuration](docs/SSO.md).

Manual startup, in separate terminals:

```powershell
cd backend
deno task dev
```

```powershell
cd frontend
npm.cmd ci
npm.cmd run dev
```

## Validation

```powershell
cd backend
deno task test
deno task auth:status
deno task audit:comparison
deno task audit:rubric
```

```powershell
cd frontend
npm.cmd ci
npm.cmd test
npm.cmd run build
```

GitHub Actions runs deterministic tests and the production build. Live retailer probes are informational: inspect their output, because a green workflow does not prove that every external source responded. Authentication tests use signed test tokens and controlled provider responses; they do not replace a real-account sign-in in production.

Validation on November 17, 2026: 117 backend tests and 59 frontend tests passed; hosted TypeScript check and production build passed. Production dependencies audit: zero known advisories. Public smoke checks confirmed catalog, history, branch stock, disabled unconfigured sign-in, rejected unauthorized collection and an authorized successful collection. Layout checks at 1348, 770 and 449 CSS pixels showed no page-level horizontal overflow (browser zoom was used for the narrower widths, not physical devices).

Translation resources are `frontend/src/locales/es.json` and `en.json`. Components use semantic keys; tests check key parity, missing static keys, interpolation and language changes, including error/accessibility labels.

## Verified development record

This is a reconstruction from actual Git history, using Chile dates and Monday–Sunday ranges. These ranges are **not** an invented mapping to the professor's 16 official semester weeks; that mapping requires the official semester start date. Empty periods remain declared. Current corrections cannot repair past continuity or missing historical README updates.

| Date range (2026) | Commits | README commits | Verifiable evidence |
|---|---:|---:|---|
| Oct 5–11 | 0 | 0 | No repository evidence |
| Oct 12–18 | 0 | 0 | No repository evidence |
| Oct 19–25 | 13 | 2 | [Initial repository](https://github.com/IFau20/Proyecto_4B/commit/265abdf1398ffe663b12957455d1f343845e7774), [API tests](https://github.com/IFau20/Proyecto_4B/commit/969ea2976d711dfb1013d8eca9af03a829c712d6), [responsive UI](https://github.com/IFau20/Proyecto_4B/commit/bd421769c383105c84aaa14ba7914757d955d669), [README](https://github.com/IFau20/Proyecto_4B/commit/e8fe2bcca0b0482d689577fa2a4486dfc16ca3df) |
| Oct 26–Nov 1 | 0 | 0 | No repository evidence |
| Nov 2–8 | 3 | 3 | [Filters](https://github.com/IFau20/Proyecto_4B/commit/ad6583dd6f0b7a49ec3943856a2a29d561d25b4e), demo comparison, dark mode. Demo prices at this stage were not live prices. |
| Nov 9–15 | 98 | 14 | [Three-source pilot](https://github.com/IFau20/Proyecto_4B/commit/3a1dce39b8cebe9b4729e7c7224ebecdeb533c99), [stock](https://github.com/IFau20/Proyecto_4B/commit/dffa09d0d3e0c5897c2cdc4d40c0a2d2e2ebe397), [live price/branch validation](https://github.com/IFau20/Proyecto_4B/commit/1113a59), [Google sign-in](https://github.com/IFau20/Proyecto_4B/commit/a8703a3) |
| Nov 16–22 (in progress) | See current history | Updated with this change | Semantic i18n resources, valid empty-catalog handling, hosted persistence and deployment configuration. |

Most work was concentrated on November 15. Neither the number of commits nor this table substitutes for continuous weekly development. [Full history](https://github.com/IFau20/Proyecto_4B/commits/main/).

## Data limitations

Not every notebook has three currently verified offers. A dated historical price is not a current quote; unverified stock is not sold out. Online stock does not demonstrate physical branch inventory. Branch quantities may be approximate. Bank-transfer prices and special conditions are identified separately.

The selected date changes opening-hours/holiday interpretation; it does not predict future inventory. Distances are approximate geographic distances, not driving routes. External sites may block or change their responses; the interface reports missing data and supports retries.

Development dependencies are audited separately from shipped browser code. The test runner was updated to remove its reported critical advisories. An upstream `picomatch` development-tool advisory currently has no fixed version available in the registry; do not downgrade build tools merely to hide it.

## Documentation

- [Architecture and persistence](docs/ARCHITECTURE.md)
- [Google/Microsoft configuration](docs/SSO.md)
- [Sources and image attribution](docs/SOURCES.md)

Implementation, testing and documentation assisted by ChatGPT/OpenAI. Public sources are attributed; access controls are not bypassed. Manufacturer identities, links and source adapters require maintenance when retailer sites change.
