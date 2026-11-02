// Compare offers for a single computer; no external services are queried.
export function getPriceComparison(rawOffers) {
  const offers = (Array.isArray(rawOffers) ? rawOffers : [])
    .filter((offer) => offer && typeof offer.sourceName === "string" && offer.sourceName.trim() !== "" && Number.isFinite(offer.priceClp) && offer.priceClp > 0)
    .slice()
    .sort((left, right) => left.priceClp - right.priceClp || left.sourceName.localeCompare(right.sourceName, "es"));

  if (offers.length === 0) {
    return { offers: [], lowestPrice: null, potentialSavings: 0 };
  }

  const lowestPrice = offers[0].priceClp;
  const highestPrice = offers[offers.length - 1].priceClp;

  return { offers, lowestPrice, potentialSavings: highestPrice - lowestPrice };
}
