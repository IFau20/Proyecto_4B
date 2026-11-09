// Compare offers for a single computer; no external services are queried.
export function getPriceComparison(rawOffers) {
  const offers = (Array.isArray(rawOffers) ? rawOffers : [])
    .filter((offer) => offer && typeof offer.sourceName === "string" && offer.sourceName.trim() !== "" &&
      (offer.priceClp === null || (Number.isFinite(offer.priceClp) && offer.priceClp > 0)))
    .slice()
    .sort((left, right) => (left.priceClp ?? Infinity) - (right.priceClp ?? Infinity) ||
      left.sourceName.localeCompare(right.sourceName, "es"));

  const priced = offers.filter((offer) => offer.priceClp !== null);
  if (priced.length === 0) return { offers, lowestPrice: null, potentialSavings: 0 };
  return { offers, lowestPrice: priced[0].priceClp,
    potentialSavings: priced[priced.length - 1].priceClp - priced[0].priceClp };
}
