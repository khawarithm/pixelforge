// src/economy/auction.js
// Solo replacement for the old Firebase-backed auction house. You list one
// item at a time; instead of live bidders, the outcome is decided by a
// seeded random roll the moment you list it, but only *revealed* once the
// listing's timer runs out — so it still has the "wait and see if it sold"
// tension of a real auction, just without needing a network or other
// players. Deterministic from the seed means checking in early vs. late
// never changes the outcome, so there's nothing to save-scum by reloading.

function seededRandom(seed) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return function next() {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export const AUCTION_DURATIONS = [
  { labelKey: 'auction_duration_5min', ms: 5 * 60 * 1000 },
  { labelKey: 'auction_duration_15min', ms: 15 * 60 * 1000 },
  { labelKey: 'auction_duration_1hr', ms: 60 * 60 * 1000 },
];

export function createListing(item, startingPrice, durationMs) {
  return {
    item,
    startingPrice,
    seed: Math.floor(Math.random() * 2147483646) + 1,
    listedAt: Date.now(),
    endsAt: Date.now() + durationMs,
  };
}

// Pure function of the listing's own seed/prices — same inputs always
// produce the same result, computed once and just revealed after the wait.
export function resolveListing(listing) {
  const rng = seededRandom(listing.seed);
  const itemValue = listing.item.value || 1;
  const askRatio = listing.startingPrice / Math.max(1, itemValue);
  // Asking well above the item's own value makes a sale less likely;
  // asking at or below it is close to a sure thing.
  const sellChance = Math.max(0.15, Math.min(0.92, 1.3 - askRatio));
  const sold = rng() < sellChance;
  if (!sold) return { sold: false, finalPrice: 0 };
  const bonusMult = 1 + rng() * 0.6; // final price: 1.0x-1.6x the asking price
  return { sold: true, finalPrice: Math.round(listing.startingPrice * bonusMult) };
}
