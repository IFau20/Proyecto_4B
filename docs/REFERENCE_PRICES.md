# Published price references for the HP pilot

The HTML scraping probe in GitHub Actions was unable to extract confirmed prices for this model on 15 November 2026. To keep the three-source comparison demonstrable, the interface separates **reference prices found in public product listings** from **verified live prices**.

Sources, SKU DB9V5AT#ABM:
- PC Express, CLP 539900: https://tienda.pc-express.cl/21702-notebook-hp-250r-intel-core-5-120u-16gb-512-gb-15-6-freedos-3-0-p-n-db9v5at-abm
- Winpy, CLP 559968: https://www.winpy.cl/venta/notebook-hp-250r-g10-de-15-6-core-5-120u-16gb-ddr5-512gb-ssd-freedos/
- SP Digital, CLP 877530: https://www.spdigital.cl/hp-250r-g10-intel-5120u-15-16gb-512-ssd-freedos/

These values were retrievable through publicly indexed product pages during the November 2026 research. Search engine crawls can lag behind live store prices; therefore **they are not live-verified offers**. The backend does not copy them into `priceClp`, does not use them for price trend collection, and never infers inventory from the reference price. They must be checked directly on the linked store before buying.

Developed with ChatGPT/OpenAI assistance.
