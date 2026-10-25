# Week 1: Computer price comparison — design

## Intent and scope

Build a small but functional first weekly increment of the 4B computer price comparison project. The course's React–Deno–API–JSON learning path determines the architecture, and the agreed comparison criteria are RAM, GPU, and processor.

## Week 1 requirements

- React UI created with Vite, responsive for desktop and mobile.
- Deno API with a named request handler exposes `GET /api/computers`.
- The API reads sample computers from a JSON file. The UI fetches this endpoint and renders the computer name, CLP example price, RAM, GPU, and processor.
- Loading, error, and empty catalog states are visible.
- Example prices/products are explicitly fictitious; no live store scraping yet.
- The code and variable identifiers are in English; explanatory README is in Spanish.
- Work happens on `develop` without merging to `main` automatically.

## Non-goals this week

Search, filters, side-by-side comparison, accounts, database, store integrations, stock, scraping, geolocation, and price history.

## Approach

- Selected: React + Vite frontend consuming a Deno JSON API, using local mock JSON data. It exercises the real integration taught in the course while remaining small.
- Considered: frontend-only React with hardcoded data, simpler but does not exercise Deno/API.
- Considered: full backend and database on day one, but it obscures weekly iteration with premature complexity.

## Boundaries and data contract

`GET /api/computers` returns an array of `{ id, name, priceClp, ramGb, gpu, processor }`. Unknown paths return 404, unsupported methods return 405. The frontend fetches the endpoint through Vite's development proxy and formats the price as Chilean pesos. Deno uses the explicit `--allow-read` and `--allow-net` permissions necessary for the API.

## Verification

Backend handler tests, frontend loading/success/error tests, production frontend build, and a local API smoke test where runtime availability permits.
