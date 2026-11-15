# Real notebook catalog and deal verification

## Identity and image sources

All 13 product models have source-supported manufacturer SKUs from public product listings and SoloTodo product profiles. The application shows names without parenthetical SKU labels, but retains the SKU for reliable matching.

Photos are obtained from each matching product listing's `og:image` metadata; when that is unavailable, matching SoloTodo product profiles are used for image identification only. Photographs are linked, not copied or generated.

## Retailers covered

Centrale, SP Digital, Winpy, PC Express, GreenChip, Paris, Ripley and Falabella. The app does not claim that every laptop has an offer from all retailers, only that offers link to known product listings.

## Prices and discount eligibility

The collector recognizes store-specific labels (CLP transfer, normal price, card-only deals), and verifies the manufacturer's SKU where the page allows it. A promotion is eligible only when the **same retailer** publishes both normal price and current sale price and `(normal - sale) / normal >= 0.20` exactly. For Ripley, the payment condition is explicitly labeled.

Live-scraped `priceClp` and historical records are kept apart from publicly indexed `referencePriceClp`. References may have changed and must not be treated as current verified store prices. A dated reference is eligible for the hero only within seven days of its observation, with a notice to confirm its validity; old references never count toward live comparison or historical trends.

## History

Each successful observed positive price is stored by SKU, retailer and UTC timestamp in the locally persisted JSON file. Store-specific date charts, range presets and date inputs allow users to inspect changes. This is an original UI inspired by comparable functionality on SoloTodo, not a copy of its database or proprietary code. Previously observed historical prices are not fabricated.

## Availability and geography

Stock reads store-specific published values, with an unknown state for 403, 429, network failures and unrecognized markup. Store and pickup point locations, published office schedules, dates and approximate user-to-store distance are available; none prove physical stock for pickup at a given location.

## Verification log

Run `deno task audit:catalog` to see the count of real products, recovered photos, actual prices, stock and discounted offers. A successful CI run proves the logic and interface tests, **not live retailer access**. The full feature claims remain conditional on retailer accessibility and Microsoft Entra credentials.
