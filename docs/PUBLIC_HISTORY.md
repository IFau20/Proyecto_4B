# Price-history source: public SoloTodo API first, local records as fallback

PC Tracker queries the documented public SoloTodo API endpoint
\`/products/{id}/pricing_history/?timestamp_after=...\` on demand for the past 365 days.

Product IDs come from known matching SoloTodo product URLs; the server verifies the
manufacturer part number before requesting history. Only available, positive CLP price
observations with valid timestamps are displayed. Rows are grouped by store and labeled
with the name returned by the public store directory where available.

The server uses a six-hour in-memory cache for successful responses. It makes no
authenticated/private requests and does not bypass access restrictions.

If SoloTodo is unavailable, blocks access, lacks a matching product, or returns no
valid series, the same \`GET /api/history?sku=...\` endpoint falls back to PC Tracker's
own durable local price observations. The response includes \`source\` to distinguish
external historical data from locally observed data. Neither is fabricated.

This experimental public API has no guaranteed uptime or explicit third-party SLA.
Confirm terms before operating a commercial deployment. Source: SoloTodo.cl;
implementation assisted by ChatGPT (OpenAI).
