// src/forging/index.js
// Pure logic, no DOM here — see forging/forge-ui.js for the interactive
// mini-game that produces the `quality` (0-100) score fed into rollForgeResult.

import { RARITY } from './ore-config.js';

export const MIN_ORE_PER_FORGE = 3;
export const MAX_ORE_PER_FORGE = 12;

const RARITY_ORDER = [
  RARITY.COMMON, RARITY.UNCOMMON, RARITY.RARE, RARITY.EPIC,
  RARITY.LEGENDARY, RARITY.MYTHIC, RARITY.TYRANT, RARITY.MAGICAL,
];
const RARITY_VALUE_MULT = [10, 25, 60, 150, 400, 900, 2000, 5000];

// Bonus modifiers rollable on top of an item's primary stat (attack, or
// hp+defense for armor). Pool is shared between sword/armor per the brief's
// modifier list (section 20) — special effects are rolled separately below.
const BONUS_MODIFIER_POOL = [
  { id: 'critical', label: 'Critical', suffix: '%', min: 2, max: 12, valuePerUnit: 9 },
  { id: 'attackSpeed', label: 'Attack Speed', suffix: '%', min: 2, max: 10, valuePerUnit: 7 },
  { id: 'moveSpeed', label: 'Move Speed', suffix: '%', min: 1, max: 6, valuePerUnit: 8 },
  { id: 'luck', label: 'Luck', suffix: '%', min: 1, max: 8, valuePerUnit: 10 },
  { id: 'defense', label: 'Defense', suffix: '', min: 2, max: 15, valuePerUnit: 4 },
  { id: 'hp', label: 'HP', suffix: '', min: 5, max: 40, valuePerUnit: 1.5 },
];

const SPECIAL_EFFECTS = [
  { id: 'double_strike', label: 'Double Strike', desc: 'Chance to strike twice per hit', value: 180 },
  { id: 'lifesteal', label: 'Lifesteal', desc: 'Heals a portion of damage dealt', value: 160 },
  { id: 'burn', label: 'Burn', desc: 'Attacks apply a burning DOT', value: 130 },
  { id: 'freeze', label: 'Freeze', desc: 'Attacks have a chance to slow', value: 130 },
  { id: 'poison', label: 'Poison', desc: 'Attacks apply poison DOT', value: 140 },
];

export function qualityLabel(q) {
  if (q >= 90) return 'Excellent';
  if (q >= 70) return 'Good';
  if (q >= 45) return 'Fair';
  return 'Poor';
}

function rarityIndexOf(oreDef) {
  return RARITY_ORDER.findIndex((r) => r.id === oreDef.rarity.id);
}

// Small, mostly-centered-on-zero shift so identical ore/quality can still
// land on different rarities between two players (brief section 13).
function rngRarityShift(rng) {
  const r = rng();
  if (r < 0.06) return -1;
  if (r < 0.90) return 0;
  if (r < 0.99) return 1;
  return 2;
}

/**
 * @param {object} params
 * @param {Array<{ore: object, count: number}>} params.composition
 *   One or more ore defs and how many units of each went into the forge.
 *   Can be a single ore (old behavior) or any free mix of different ores —
 *   the result blends proportionally by how much of each was used.
 * @param {'sword'|'armor'} params.type
 * @param {number} params.quality  - 0-100 mini-game performance score
 * @param {number} [params.luck]   - 0-1, current player luck (from pickaxe etc.)
 * @param {() => number} [params.rng]
 */
export function rollForgeResult({ composition, type, quality, luck = 0, rng = Math.random }) {
  const totalCount = composition.reduce((s, c) => s + c.count, 0);

  // Blend by weight: using mostly common ore with a splash of something
  // rare mostly gives you common-tier results with a slight bump, rather
  // than either extreme fully dominating.
  const weightedRarityIdx = composition.reduce(
    (s, c) => s + rarityIndexOf(c.ore) * (c.count / totalCount), 0
  );
  const potential = composition.reduce((s, c) => s + c.ore.basePrice * (c.count / totalCount), 0);
  const materialValue = composition.reduce((s, c) => s + c.ore.basePrice * c.count, 0);

  let idx = Math.round(weightedRarityIdx);
  if (quality >= 90) idx += 1;
  if (quality >= 98) idx += 1;
  if (quality < 35) idx -= 1;
  if (rng() < luck * 0.5) idx += 1;
  idx += rngRarityShift(rng);
  idx = Math.max(0, Math.min(RARITY_ORDER.length - 1, idx));
  const rarity = RARITY_ORDER[idx];

  const qualityMult = 0.6 + (quality / 100) * 0.8; // 0.6x .. 1.4x
  const tierMult = 1 + idx * 0.12;

  const stats = {};
  if (type === 'sword') {
    const baseAtk = Math.round((8 + potential * 0.35) * qualityMult * tierMult);
    stats.attack = Math.max(3, baseAtk + Math.round((rng() * 2 - 1) * baseAtk * 0.15));
  } else {
    const baseHp = Math.round((20 + potential * 0.6) * qualityMult * tierMult);
    const baseDef = Math.round((4 + potential * 0.18) * qualityMult * tierMult);
    stats.hp = Math.max(5, baseHp);
    stats.defense = Math.max(1, baseDef);
  }

  // Committing more total ore (up to the 12 cap) modestly raises the odds
  // of extra bonus modifiers, on top of quality/rarity — using more
  // material is meant to feel worthwhile, not just a way to spend surplus.
  const extraModifierCount = Math.min(
    BONUS_MODIFIER_POOL.length,
    Math.floor(quality / 25) + (idx >= 4 ? 1 : 0) + Math.floor(totalCount / 6)
  );
  const pool = [...BONUS_MODIFIER_POOL];
  for (let i = 0; i < extraModifierCount; i++) {
    if (pool.length === 0) break;
    const pick = pool.splice(Math.floor(rng() * pool.length), 1)[0];
    stats[pick.id] = +(pick.min + rng() * (pick.max - pick.min)).toFixed(1);
  }

  let specialEffect = null;
  const effectChance = Math.min(0.6, 0.05 + luck * 0.3 + (idx / RARITY_ORDER.length) * 0.25);
  if (rng() < effectChance) {
    specialEffect = SPECIAL_EFFECTS[Math.floor(rng() * SPECIAL_EFFECTS.length)];
  }

  const statValue = Object.entries(stats).reduce((sum, [key, val]) => {
    if (key === 'attack') return sum + val * 3;
    if (key === 'hp') return sum + val * 1.5;
    if (key === 'defense') return sum + val * 4;
    const modDef = BONUS_MODIFIER_POOL.find((m) => m.id === key);
    return sum + (modDef ? val * modDef.valuePerUnit : 0);
  }, 0);

  const rarityModifier = RARITY_VALUE_MULT[idx];
  const qualityModifier = Math.round(quality * 2.5);
  const specialEffectValue = specialEffect?.value ?? 0;
  const value = Math.round(materialValue + rarityModifier + qualityModifier + statValue + specialEffectValue);

  // Dominant ore (most units used) names the item and picks its itemId —
  // keeps names readable ("Rare Iron Sword") even when a little of
  // something else was mixed in, rather than a name per ore combination.
  const dominant = [...composition].sort((a, b) => b.count - a.count)[0].ore;
  const isBlend = composition.length > 1;

  // Stored for the "ore=iron:66%,copper:33%" display in inventory/shop —
  // percentages are rounded independently and may not sum to exactly 100,
  // which is expected (66+33=99, etc.), not a bug.
  const oreComposition = composition
    .map((c) => ({ oreId: c.ore.id, percent: Math.round((c.count / totalCount) * 100) }))
    .sort((a, b) => b.percent - a.percent);

  return {
    instanceId: 'EQ_' + Math.random().toString(36).slice(2, 9).toUpperCase(),
    itemId: `${dominant.id}_${type}`,
    type,
    name: `${rarity.label} ${dominant.name.replace(' Ore', '')} ${type === 'sword' ? 'Sword' : 'Armor'}${isBlend ? ' (Blend)' : ''}`,
    rarity: rarity.id,
    rarityLabel: rarity.label,
    rarityColor: rarity.color,
    quality: Math.round(quality),
    qualityLabel: qualityLabel(quality),
    stats,
    statLabels: Object.fromEntries(BONUS_MODIFIER_POOL.map((m) => [m.id, { label: m.label, suffix: m.suffix }])),
    specialEffect: specialEffect?.id ?? null,
    specialEffectLabel: specialEffect?.label ?? null,
    specialEffectDesc: specialEffect?.desc ?? null,
    oreComposition,
    value,
    equipped: false,
    createdAt: Date.now(),
  };
}

