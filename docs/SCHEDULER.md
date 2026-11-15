# Price collection scheduler

The Deno backend now performs a best-effort collection when started and every six hours while running, for both the Lenovo LOQ and HP 250R. Successful observed, in-stock (or unknown-stock) prices are persisted in backend/data/price-history.json. Requesting a live comparison also updates the history.

All records are actual observations, never inferred historical prices. The scheduler only runs while the backend is online. JSON storage is local and persistent only if the deployment keeps its disk; a production multi-instance deployment requires shared durable storage, and an external scheduler if an always-on service is unavailable.

Manual diagnostics:
- deno task check:live (Lenovo)
- deno task check:hp (HP)

GitHub Actions runs both probes as informational checks and outputs actual retailer responses; it does not fail production builds when a retailer blocks the crawler or a model is unavailable.

Programmed with ChatGPT/OpenAI assistance.
