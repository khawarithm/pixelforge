// src/quality/index.js
// "Quality" ladder for Passives (Tomes) and Skills (Scrolls) — separate
// from forging/index.js's 0-100 forge-quality score, this is a discrete
// rarity-style tier (mirrors config/ore.js's RARITY ladder) that every
// dropped Tome/Scroll instance rolls once, on top of picking which def it
// is. A higher tier multiplies the def's base stat value up (see
// qualityStatMult below, used by passives/index.js + skills/index.js) and
// is drawn from a much thinner slice of the weighted pool, so stronger
// Tomes/Scrolls are meaningfully rarer to find in the dungeon — exactly
// like a rarer ore vein.

import { ICON_BASE } from './config-assets.js';

const QUALITY_ICON = ICON_BASE + 'ui/quality_gem.svg';

export const QUALITY = {
  COMMON:    { id: 'common',    name: 'Common',    statMult: 1.00, dropWeight: 100, color: '#9aa0a6', icon: QUALITY_ICON },
  FINE:      { id: 'fine',      name: 'Fine',       statMult: 1.20, dropWeight: 52,  color: '#2f6f3e', icon: QUALITY_ICON },
  SUPERIOR:  { id: 'superior',  name: 'Superior',   statMult: 1.45, dropWeight: 26,  color: '#3d7fd6', icon: QUALITY_ICON },
  EXQUISITE: { id: 'exquisite', name: 'Exquisite',  statMult: 1.80, dropWeight: 11,  color: '#8b3fd4', icon: QUALITY_ICON },
  FLAWLESS:  { id: 'flawless',  name: 'Flawless',   statMult: 2.25, dropWeight: 4,   color: '#d4a72c', icon: QUALITY_ICON },
  PERFECT:   { id: 'perfect',   name: 'Perfect',    statMult: 3.00, dropWeight: 1,   color: '#b0303a', icon: QUALITY_ICON },
};

// Lowest -> highest, used for weighted rolls and for UI ordering.
export const QUALITY_ORDER = ['common', 'fine', 'superior', 'exquisite', 'flawless', 'perfect'];

export const QUALITY_BY_ID = Object.fromEntries(Object.values(QUALITY).map((q) => [q.id, q]));

export function qualityDef(qualityId) {
  return QUALITY_BY_ID[qualityId] ?? QUALITY.COMMON;
}

// Rolls a Quality tier. `luck` is the same 0-1 combat stat used everywhere
// else (mining, dungeon loot); `floor` is the current dungeon floor —
// deeper floors skew the roll toward higher tiers too, same idea as
// dungeon/index.js's FLOOR_GROWTH making enemies tougher but their loot
// better. COMMON's own weight never gets boosted, so the top of the ladder
// only ever eats into the rest of the pool, never inflates past it.
export function rollQuality(luck = 0, floor = 1, rng = Math.random) {
  const floorBoost = Math.min(2.5, (Math.max(1, floor) - 1) * 0.08);
  const luckBoost = Math.min(2, Math.max(0, luck) * 4);
  const boost = 1 + floorBoost + luckBoost;

  const pool = QUALITY_ORDER.map((id) => QUALITY_BY_ID[id]);
  const weights = pool.map((q, i) => (i === 0 ? q.dropWeight : q.dropWeight * boost));
  const total = weights.reduce((s, w) => s + w, 0);
  let roll = rng() * total;
  for (let i = 0; i < pool.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return pool[i].id;
  }
  return pool[pool.length - 1].id;
}

export function qualityStatMult(qualityId) {
  return qualityDef(qualityId).statMult;
}

export function qualityName(qualityId) {
  return qualityDef(qualityId).name;
}

export function qualityColor(qualityId) {
  return qualityDef(qualityId).color;
}
