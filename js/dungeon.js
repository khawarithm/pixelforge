// src/dungeon/index.js
// Only "Abandoned Mine" is built out for Phase 3, matching the brief's phase
// plan (get one dungeon + boss fully playable before adding more biomes in
// Phase 6). Lava Cavern / Frozen Cavern / Ancient Ruins reuse this exact
// data shape — add new entries here + a matching world in game/world.js.

import { rollPassiveDrop } from './passives.js';
import { rollSkillScrollDrop } from './skills.js';
import { rollQuality } from './quality.js';

export const ENEMY_DEFS = {
  cave_rat: {
    id: 'cave_rat', name: 'Cave Rat', hp: 18, damage: 4, defense: 0,
    speed: 70, attackRange: 22, detectRadius: 100, attackCooldown: 900,
    color: '#8a6a42', size: 8, xp: 4,
    lootTable: { goldMin: 1, goldMax: 3, oreChance: 0.18, ore: 'coal' },
  },
  miner_zombie: {
    id: 'miner_zombie', name: 'Miner Zombie', hp: 34, damage: 7, defense: 1,
    speed: 48, attackRange: 26, detectRadius: 120, attackCooldown: 1200,
    color: '#4f6f4f', size: 11, xp: 8,
    lootTable: { goldMin: 3, goldMax: 7, oreChance: 0.22, ore: 'iron' },
  },
  stone_golem: {
    id: 'stone_golem', name: 'Stone Golem', hp: 62, damage: 12, defense: 4,
    speed: 32, attackRange: 30, detectRadius: 110, attackCooldown: 1500,
    color: '#6b6b6b', size: 14, xp: 14,
    lootTable: { goldMin: 6, goldMax: 12, oreChance: 0.25, ore: 'tin' },
  },
  stone_titan: {
    id: 'stone_titan', name: 'Stone Titan', hp: 220, damage: 16, defense: 6,
    speed: 36, attackRange: 36, detectRadius: 220, attackCooldown: 1100,
    color: '#3a3a3a', size: 22, isBoss: true, xp: 80,
    lootTable: { goldMin: 40, goldMax: 80, oreChance: 0.6, ore: 'silver' },
  },
};

export const DUNGEONS = {
  abandoned_mine: {
    id: 'abandoned_mine',
    name: 'Abandoned Mine',
    ticketCost: 30, // gold — Phase 5 economy adds proper NPC/trade/quest ticket sources
    bossId: 'stone_titan',
  },
};

// Endless floor scaling: floor 1 is each enemy's base ENEMY_DEFS stats
// as-is. Every floor beyond that nudges hp/damage/defense/rewards up so
// the dive keeps getting harder the deeper the player pushes — there is
// no final floor, only how far a given run gets before the player dies
// or retreats.
const FLOOR_GROWTH = {
  hp: 0.20,      // +20% enemy hp per floor past 1
  damage: 0.12,  // +12% enemy damage per floor past 1
  defense: 0.10, // +10% enemy defense per floor past 1
  xp: 0.15,      // +15% xp reward per floor past 1
  gold: 0.15,    // +15% loot gold per floor past 1
};

export function scaleEnemyDef(def, floor) {
  const n = Math.max(1, floor) - 1;
  if (n === 0) return def;
  return {
    ...def,
    hp: Math.round(def.hp * (1 + FLOOR_GROWTH.hp * n)),
    damage: Math.round(def.damage * (1 + FLOOR_GROWTH.damage * n)),
    defense: Math.round(def.defense * (1 + FLOOR_GROWTH.defense * n)),
    xp: Math.round(def.xp * (1 + FLOOR_GROWTH.xp * n)),
    lootTable: {
      ...def.lootTable,
      goldMin: Math.round(def.lootTable.goldMin * (1 + FLOOR_GROWTH.gold * n)),
      goldMax: Math.round(def.lootTable.goldMax * (1 + FLOOR_GROWTH.gold * n)),
    },
  };
}

// Flat depth bonus granted once when a dive ends (death OR retreat),
// scaled only by how many floor bosses were actually defeated this run —
// clearing floor 1's boss counts as 1. This is on top of the per-kill
// gold/ore/xp already banked along the way, so a deeper run always nets
// meaningfully more than a shallow one even if the final death loses
// nothing already collected.
export function dungeonEndBonus(floorsCleared) {
  return {
    gold: floorsCleared * 20,
    xp: floorsCleared * 5,
  };
}

// Rolls a single enemy's death drop. Luck (0-1) nudges the ore-drop odds up,
// same convention as mining — never guarantees a drop. Also rolls the
// newer Passive Tome / Skill Scroll / Enchant Fragment / Training Fragment
// drops (Phase 7) — each independent of the others, so a single kill can
// (rarely) drop several different things at once. `floor` is the current
// dungeon floor: it's folded into the Quality roll (src/quality/index.js)
// for any Tome/Scroll that drops, so deeper dives find stronger, rarer
// gear on top of the tougher enemies already guarding them.
export function rollEnemyLoot(enemyDef, luck = 0, floor = 1, rng = Math.random) {
  const { goldMin, goldMax, oreChance, ore } = enemyDef.lootTable;
  const gold = goldMin + Math.floor(rng() * (goldMax - goldMin + 1));
  const dropsOre = rng() < Math.min(0.95, oreChance + luck * 0.3);
  const passiveDefId = rollPassiveDrop(luck, rng);
  const passiveQuality = passiveDefId ? rollQuality(luck, floor, rng) : null;
  const skillDefId = rollSkillScrollDrop(luck, rng);
  const skillQuality = skillDefId ? rollQuality(luck, floor, rng) : null;
  const enchantFragments = rng() < Math.min(0.4, 0.12 + luck * 0.15) ? 1 + Math.floor(rng() * 2) : 0;
  const trainingFragments = rng() < Math.min(0.3, 0.08 + luck * 0.1) ? 1 : 0;
  return {
    gold, ore: dropsOre ? ore : null,
    passiveDefId, passiveQuality,
    skillDefId, skillQuality,
    enchantFragments, trainingFragments,
  };
}
