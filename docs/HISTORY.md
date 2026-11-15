# Price history (real observations only)

`GET /api/history?sku=83JC0080CL` lists timestamped prices observed in retailer responses. The collection process stores successful positive prices every six hours per retailer/SKU, excluding explicitly sold-out items. No data is backfilled. Data is saved under `backend/data/price-history.json` and deliberately excluded from Git, so the real installation retains its own persistent history.

The JSON file is **local persistent storage**. If the backend is redeployed without a persistent volume, its historical records will be lost. For production, mount a persistent disk, migrate to a database, or run a scheduled ingestion service. This limitation is explicit in the demo.

`Deno test` checks deduplication, valid prices and price trends without writing files. Code produced with ChatGPT/OpenAI assistance.
