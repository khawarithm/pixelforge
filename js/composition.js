// src/forging/composition.js
// An item forged from a single ore has no oreComposition (nothing to
// break down); one forged from a mix stores it as
// [{ oreId, percent }, ...] sorted by share, largest first. Percentages
// are rounded independently and may not sum to exactly 100 — that's
// expected (e.g. 66% + 33% = 99%), not a bug.
export function formatOreComposition(item) {
  if (!item.oreComposition || item.oreComposition.length < 2) return null;
  return 'ore=' + item.oreComposition.map((c) => `${c.oreId}:${c.percent}%`).join(',');
}
