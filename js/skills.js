// src/skills/index.js
// Skill Scrolls — items that drop from dungeon enemies, kept in the
// inventory panel's Skills list and equipped up to 2 at a time. Equipping a
// skill makes an activation button appear next to the action ("MINE" /
// "ATTACK") button in the HUD (see index.html #skill-btn-1/2 and
// game/engine.js's skill runtime). Each has a duration + cooldown and can
// be leveled up at the Enchanter NPC using Training Fragments.
//
// Every dropped instance also rolls a Quality tier (src/quality/index.js)
// — COMMON up to PERFECT — independent of its Level (Level comes from
// Training Fragments spent at the Enchanter; Quality is fixed the moment
// it drops). Quality multiplies the skill's `value` — how strong the
// buff/heal/shield actually is — via skillValue() below, so a Superior
// Power Surge hits harder than a Common one even at the same level.

import { SKILL_ICON_PATHS } from './config-assets.js';
import { qualityStatMult } from './quality.js';

export const MAX_EQUIPPED_SKILLS = 2;

export const SKILL_DEFS = {
  power_surge: {
    id: 'power_surge', name: 'Power Surge', icon: SKILL_ICON_PATHS.power_surge, type: 'power',
    desc: 'Temporarily increases attack damage',
    baseDuration: 6, baseCooldown: 20, baseValue: 0.5, // +50% attack at level 1
    maxLevel: 5, valuePerLevel: 0.12, durationPerLevel: 0.6, cooldownReductionPerLevel: 1.5,
  },
  second_wind: {
    id: 'second_wind', name: 'Second Wind', icon: SKILL_ICON_PATHS.second_wind, type: 'regen',
    desc: 'Regenerates HP over a few seconds',
    baseDuration: 5, baseCooldown: 25, baseValue: 0.06, // 6% max HP per second at level 1
    maxLevel: 5, valuePerLevel: 0.015, durationPerLevel: 0.4, cooldownReductionPerLevel: 1.5,
  },
  stoneskin: {
    id: 'stoneskin', name: 'Stoneskin', icon: SKILL_ICON_PATHS.stoneskin, type: 'invincible',
    desc: 'Grants brief immunity to damage',
    baseDuration: 3, baseCooldown: 35, baseValue: 1,
    maxLevel: 5, valuePerLevel: 0, durationPerLevel: 0.6, cooldownReductionPerLevel: 2,
  },
  // --- New Skills ---
  berserker_rage: {
    id: 'berserker_rage', name: 'Berserker Rage', icon: SKILL_ICON_PATHS.berserker_rage, type: 'power',
    desc: 'A fiercer, longer-cooldown surge — massively increases attack damage',
    baseDuration: 5, baseCooldown: 40, baseValue: 0.9, // +90% attack at level 1
    maxLevel: 5, valuePerLevel: 0.18, durationPerLevel: 0.4, cooldownReductionPerLevel: 2.5,
  },
  adrenaline_rush: {
    id: 'adrenaline_rush', name: 'Adrenaline Rush', icon: SKILL_ICON_PATHS.adrenaline_rush, type: 'haste',
    desc: 'Temporarily increases attack speed and movement speed',
    baseDuration: 6, baseCooldown: 22, baseValue: 0.35, // +35% attack/move speed at level 1
    maxLevel: 5, valuePerLevel: 0.07, durationPerLevel: 0.5, cooldownReductionPerLevel: 1.5,
  },
  guardian_ward: {
    id: 'guardian_ward', name: 'Guardian Ward', icon: SKILL_ICON_PATHS.guardian_ward, type: 'shield',
    desc: 'Temporarily reduces incoming damage instead of blocking it outright',
    baseDuration: 8, baseCooldown: 28, baseValue: 0.45, // -45% incoming damage at level 1
    maxLevel: 5, valuePerLevel: 0.08, durationPerLevel: 0.6, cooldownReductionPerLevel: 1.5,
  },
};

const SKILL_DROP_CHANCE = 0.04; // base chance per dungeon enemy kill, before luck

export function rollSkillScrollDrop(luck = 0, rng = Math.random) {
  const chance = Math.min(0.3, SKILL_DROP_CHANCE + luck * 0.08);
  if (rng() >= chance) return null;
  const pool = Object.values(SKILL_DEFS);
  return pool[Math.floor(rng() * pool.length)].id;
}

export function createSkillInstance(defId, quality = 'common') {
  if (!SKILL_DEFS[defId]) return null;
  return {
    instanceId: 'SKL_' + Math.random().toString(36).slice(2, 9).toUpperCase(),
    defId,
    quality,
    equipped: false,
    level: 1,
  };
}

export function skillDuration(instance) {
  const def = SKILL_DEFS[instance?.defId];
  if (!def) return 0;
  return def.baseDuration + (def.durationPerLevel ?? 0) * (instance.level - 1);
}

export function skillCooldown(instance) {
  const def = SKILL_DEFS[instance?.defId];
  if (!def) return 0;
  return Math.max(4, def.baseCooldown - (def.cooldownReductionPerLevel ?? 0) * (instance.level - 1));
}

// Level scales the base value up (Training Fragments); Quality then
// multiplies the level-scaled value on top — the two are independent
// power sources, same idea as gear enchant level vs. gear rarity.
export function skillValue(instance) {
  const def = SKILL_DEFS[instance?.defId];
  if (!def) return 0;
  const leveled = def.baseValue + (def.valuePerLevel ?? 0) * (instance.level - 1);
  return leveled * qualityStatMult(instance?.quality);
}

// Training Fragment cost to go from `instance.level` to `instance.level + 1`.
// Returns null once the skill is already at its max level.
export function trainingFragmentCostForUpgrade(instance) {
  const def = SKILL_DEFS[instance?.defId];
  if (!def || instance.level >= def.maxLevel) return null;
  return instance.level * 3; // 1->2 costs 3, 2->3 costs 6, 3->4 costs 9, 4->5 costs 12
}
