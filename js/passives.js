// src/passives/index.js
// Passives ("Tomes") — items that drop from dungeon enemies, kept in the
// inventory panel's Passives list and equipped up to 2 at a time. Each
// grants a permanent, additive bonus while equipped. See combat/index.js
// (computePassiveBonuses is folded into computeCombatStats) for how the
// bonus actually reaches combat, and inventory/inventory.js for the
// max-2-equipped enforcement.
//
// Every dropped instance also rolls a Quality tier (src/quality/index.js)
// — COMMON up to PERFECT. Quality multiplies the def's base `value` (see
// effectivePassiveValue() below), so two copies of the same Tome are not
// equal: a Flawless Tome of Might hits noticeably harder than a Common
// one. See dungeon/index.js's rollEnemyLoot for where the roll happens
// (deeper floors + higher luck skew toward rarer, stronger Quality).

import { PASSIVE_ICON_PATHS } from './config-assets.js';
import { qualityStatMult } from './quality.js';

export const MAX_EQUIPPED_PASSIVES = 2;

export const PASSIVE_DEFS = {
  tome_vitality: {
    id: 'tome_vitality', name: 'Tome of Vitality', icon: PASSIVE_ICON_PATHS.tome_vitality,
    desc: 'Increases maximum HP', effect: 'hp', value: 25, dropWeight: 10,
  },
  tome_might: {
    id: 'tome_might', name: 'Tome of Might', icon: PASSIVE_ICON_PATHS.tome_might,
    desc: 'Increases attack damage', effect: 'attack', value: 6, dropWeight: 10,
  },
  tome_fortune: {
    id: 'tome_fortune', name: 'Tome of Fortune', icon: PASSIVE_ICON_PATHS.tome_fortune,
    desc: 'Increases luck (better drop odds)', effect: 'luck', value: 0.08, dropWeight: 8,
  },
  tome_haste: {
    id: 'tome_haste', name: 'Tome of Haste', icon: PASSIVE_ICON_PATHS.tome_haste,
    desc: 'Increases attack speed', effect: 'attackSpeed', value: 0.12, dropWeight: 8,
  },
  tome_resilience: {
    id: 'tome_resilience', name: 'Tome of Resilience', icon: PASSIVE_ICON_PATHS.tome_resilience,
    desc: 'Increases defense', effect: 'defense', value: 4, dropWeight: 7,
  },
  tome_greed: {
    id: 'tome_greed', name: 'Tome of Greed', icon: PASSIVE_ICON_PATHS.tome_greed,
    desc: 'Increases gold earned from enemies', effect: 'goldMult', value: 0.15, dropWeight: 6,
  },
  // --- New Tomes ---
  tome_precision: {
    id: 'tome_precision', name: 'Tome of Precision', icon: PASSIVE_ICON_PATHS.tome_precision,
    desc: 'Increases critical hit chance', effect: 'critChance', value: 0.05, dropWeight: 6,
  },
  tome_swiftness: {
    id: 'tome_swiftness', name: 'Tome of Swiftness', icon: PASSIVE_ICON_PATHS.tome_swiftness,
    desc: 'Increases movement speed', effect: 'moveSpeedMult', value: 0.08, dropWeight: 6,
  },
  tome_ambition: {
    id: 'tome_ambition', name: 'Tome of Ambition', icon: PASSIVE_ICON_PATHS.tome_ambition,
    desc: 'Increases XP earned from enemies', effect: 'xpMult', value: 0.12, dropWeight: 5,
  },
  tome_vampirism: {
    id: 'tome_vampirism', name: 'Tome of Vampirism', icon: PASSIVE_ICON_PATHS.tome_vampirism,
    desc: 'Heals a portion of damage dealt as lifesteal', effect: 'lifesteal', value: 0.05, dropWeight: 4,
  },
  tome_warding: {
    id: 'tome_warding', name: 'Tome of Warding', icon: PASSIVE_ICON_PATHS.tome_warding,
    desc: 'Further increases defense', effect: 'defense', value: 3, dropWeight: 5,
  },
  tome_insight: {
    id: 'tome_insight', name: 'Tome of Insight', icon: PASSIVE_ICON_PATHS.tome_insight,
    desc: 'Further increases luck', effect: 'luck', value: 0.05, dropWeight: 4,
  },
};

const PASSIVE_DROP_CHANCE = 0.05; // base chance per dungeon enemy kill, before luck

// Rolls whether a dungeon kill drops a passive Tome, and which one. Returns
// a defId (key into PASSIVE_DEFS) or null. Luck (0-1, same convention as
// mining/ore) nudges the odds up, same as every other dungeon drop roll.
export function rollPassiveDrop(luck = 0, rng = Math.random) {
  const chance = Math.min(0.35, PASSIVE_DROP_CHANCE + luck * 0.1);
  if (rng() >= chance) return null;
  const pool = Object.values(PASSIVE_DEFS);
  const totalWeight = pool.reduce((s, p) => s + p.dropWeight, 0);
  let roll = rng() * totalWeight;
  for (const def of pool) {
    roll -= def.dropWeight;
    if (roll <= 0) return def.id;
  }
  return pool[pool.length - 1].id;
}

export function createPassiveInstance(defId, quality = 'common') {
  if (!PASSIVE_DEFS[defId]) return null;
  return {
    instanceId: 'PSV_' + Math.random().toString(36).slice(2, 9).toUpperCase(),
    defId,
    quality,
    equipped: false,
  };
}

// The actual bonus a given instance grants once its Quality multiplier is
// applied — this is the number that should ever be shown in UI or folded
// into combat stats, never def.value directly.
export function effectivePassiveValue(instance) {
  const def = PASSIVE_DEFS[instance?.defId];
  if (!def) return 0;
  return def.value * qualityStatMult(instance?.quality);
}

// Folds every currently-equipped passive INSTANCE (not just defId — Quality
// lives on the instance) into one additive bonus object. Called from
// combat/index.js on every combatStats recompute.
export function computePassiveBonuses(equippedInstances = []) {
  const bonus = {
    hp: 0, attack: 0, luck: 0, attackSpeed: 0, defense: 0, goldMult: 0,
    critChance: 0, moveSpeedMult: 0, xpMult: 0, lifesteal: 0,
  };
  for (const instance of equippedInstances) {
    const def = PASSIVE_DEFS[instance?.defId];
    if (!def) continue;
    if (def.effect in bonus) bonus[def.effect] += effectivePassiveValue(instance);
  }
  return bonus;
}
