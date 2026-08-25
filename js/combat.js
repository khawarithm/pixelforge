// src/combat/index.js
// Pure logic — no DOM, no canvas. Engine calls into this each attack.

import { computePassiveBonuses } from './passives.js';
import { enchantBonusStats } from './enchant.js';

const BASE_STATS = {
  maxHp: 100,
  attack: 5,      // bare-fist damage if no sword equipped
  defense: 0,
  critChance: 0.05,
  attackSpeedMult: 1,
  moveSpeedMult: 1,
  luck: 0,
  goldMult: 1,
  xpMult: 1,
  lifestealBonus: 0,   // flat extra lifesteal ratio from Tomes (Tome of Vampirism)
  damageReduction: 0,  // temporary incoming-damage cut from an active Skill (Guardian Ward)
  invincible: false,
};

const CRIT_MULT = 1.75;
const DOUBLE_STRIKE_CHANCE = 0.25;
const LIFESTEAL_RATIO = 0.18;

// Reads currently-equipped sword/armor off the inventory and folds their
// rolled stats into a flat combat-stats object. Cheap enough to call on
// every attack (inventory.equipment is a short list).
//
// `activeBuffs` is engine-driven, temporary state from equipped Skills
// (see skills/index.js + game/engine.js's skill runtime) — { attackMult,
// invincible }. Passives (Tomes) are permanent instead and read straight
// off inventory.passives every time, no separate parameter needed.
export function computeCombatStats(inventory, activeBuffs = {}) {
  const stats = { ...BASE_STATS, specialEffects: [] };
  const sword = inventory.equipment.find((e) => e.equipped && e.type === 'sword');
  const armor = inventory.equipment.find((e) => e.equipped && e.type === 'armor');

  // Small, steady level bonus (Phase 6) — makes leveling feel like it
  // matters even before you've forged anything better, without dwarfing
  // what good gear contributes.
  const level = inventory.level ?? 1;
  stats.maxHp += (level - 1) * 5;
  stats.attack += (level - 1) * 1;

  if (sword) {
    const enchant = enchantBonusStats(sword);
    stats.attack += (sword.stats.attack ?? 0) + (enchant.attack ?? 0);
    stats.critChance += (sword.stats.critical ?? 0) / 100;
    stats.attackSpeedMult += (sword.stats.attackSpeed ?? 0) / 100;
    stats.moveSpeedMult += (sword.stats.moveSpeed ?? 0) / 100;
    stats.luck += (sword.stats.luck ?? 0) / 100;
    if (sword.specialEffect) stats.specialEffects.push(sword.specialEffect);
  }
  if (armor) {
    const enchant = enchantBonusStats(armor);
    stats.maxHp += (armor.stats.hp ?? 0) + (enchant.hp ?? 0);
    stats.defense += (armor.stats.defense ?? 0) + (enchant.defense ?? 0);
    stats.critChance += (armor.stats.critical ?? 0) / 100;
    stats.moveSpeedMult += (armor.stats.moveSpeed ?? 0) / 100;
    stats.luck += (armor.stats.luck ?? 0) / 100;
    if (armor.specialEffect) stats.specialEffects.push(armor.specialEffect);
  }

  // Passives (Tomes) — up to 2 equipped at once, folded in additively.
  // Pass the full equipped INSTANCES (not just defIds) — Quality lives on
  // the instance and scales each Tome's contribution (see passives/index.js).
  const equippedPassives = (inventory.passives ?? []).filter((p) => p.equipped);
  const passiveBonus = computePassiveBonuses(equippedPassives);
  stats.maxHp += passiveBonus.hp;
  stats.attack += passiveBonus.attack;
  stats.luck += passiveBonus.luck;
  stats.attackSpeedMult += passiveBonus.attackSpeed;
  stats.defense += passiveBonus.defense;
  stats.goldMult += passiveBonus.goldMult;
  stats.critChance += passiveBonus.critChance;
  stats.moveSpeedMult += passiveBonus.moveSpeedMult;
  stats.xpMult += passiveBonus.xpMult;
  stats.lifestealBonus += passiveBonus.lifesteal;

  // Active Skill buffs (temporary, engine-driven).
  if (activeBuffs.attackMult) stats.attack = Math.round(stats.attack * (1 + activeBuffs.attackMult));
  if (activeBuffs.hasteMult) {
    stats.attackSpeedMult *= 1 + activeBuffs.hasteMult;
    stats.moveSpeedMult *= 1 + activeBuffs.hasteMult;
  }
  if (activeBuffs.damageReduction) stats.damageReduction = Math.max(stats.damageReduction, activeBuffs.damageReduction);
  stats.invincible = !!activeBuffs.invincible;

  return stats;
}

// One player swing. Returns damage dealt (possibly twice, for Double Strike)
// plus metadata the UI/engine can use for floating text, lifesteal, etc.
export function resolvePlayerHit(stats, rng = Math.random) {
  const swing = () => {
    const isCrit = rng() < stats.critChance;
    const damage = Math.max(1, Math.round(stats.attack * (isCrit ? CRIT_MULT : 1)));
    return { damage, isCrit };
  };
  const hits = [swing()];
  if (stats.specialEffects.includes('double_strike') && rng() < DOUBLE_STRIKE_CHANCE) {
    hits.push(swing());
  }
  const totalDamage = hits.reduce((s, h) => s + h.damage, 0);
  const lifestealRatio = (stats.specialEffects.includes('lifesteal') ? LIFESTEAL_RATIO : 0) + (stats.lifestealBonus ?? 0);
  const lifesteal = lifestealRatio > 0 ? Math.round(totalDamage * lifestealRatio) : 0;
  return { hits, totalDamage, lifesteal, specialEffects: stats.specialEffects };
}

// Enemy damage reduced by player defense (soft diminishing curve, never
// reduces below 1 so defense can't make the player fully immune) — unless
// the player currently has the Stoneskin skill buff active, in which case
// every hit is fully absorbed. `damageReduction` (0-1) is an extra,
// temporary percentage cut from a Skill like Guardian Ward, applied before
// the flat defense subtraction.
export function resolveEnemyHitOnPlayer(rawDamage, defense, invincible = false, damageReduction = 0) {
  if (invincible) return 0;
  const afterReduction = rawDamage * (1 - Math.min(0.95, Math.max(0, damageReduction)));
  return Math.max(1, Math.round(afterReduction - defense * 0.5));
}
