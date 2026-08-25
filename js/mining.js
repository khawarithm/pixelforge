// src/systems/mining.js
import { ORES } from './ore-config.js';
import { PICKAXES } from './pickaxe-config.js';

const NODE_MAX_HP = {
  // early_mine
  copper: 3, iron: 4, coal: 3, tin: 5,
  // deep_mine
  silver: 6, gold: 7, platinum: 8, diamond: 10,
  // crystal_mine (Lv.10)
  quartz_crystal: 9, opal: 11, amethyst: 11, obsidian_shard: 12,
  ruby: 11, sapphire: 11, emerald: 12, mythril: 13,
  // molten_mine (Lv.15)
  sulfur_crystal: 10, magma_shard: 12, volcanic_glass: 13, phoenix_ore: 15,
  // abyssal_mine (Lv.20)
  abyssal_pearl: 15, star_fragment: 17, void_shard: 18, chaos_ore: 20,
  ancient_ore: 16, magical_ore: 18, tyrant_ore: 17,
};
const RESPAWN_SECONDS = 12;

export class MiningNode {
  constructor(oreId, tileX, tileY) {
    this.oreId = oreId;
    this.tileX = tileX;
    this.tileY = tileY;
    this.maxHp = NODE_MAX_HP[oreId] ?? 4;
    this.hp = this.maxHp;
    this.depleted = false;
    this.respawnTimer = 0;
  }

  update(dt) {
    if (this.depleted) {
      this.respawnTimer -= dt;
      if (this.respawnTimer <= 0) {
        this.depleted = false;
        this.hp = this.maxHp;
      }
    }
  }

  // Returns the ore def this node drops, or null if hp not depleted yet.
  applyDamage(amount) {
    if (this.depleted) return null;
    this.hp -= amount;
    if (this.hp <= 0) {
      this.depleted = true;
      this.respawnTimer = RESPAWN_SECONDS;
      return ORES[this.oreId];
    }
    return null;
  }
}

// Small variance so pickaxes of the same tier don't feel perfectly identical.
export function rollPickaxeVariance(basePickaxe, rng = Math.random) {
  const variance = 0.06; // +/-6%
  const mult = 1 + (rng() * 2 - 1) * variance;
  return {
    ...basePickaxe,
    miningSpeed: +(basePickaxe.miningSpeed * mult).toFixed(3),
  };
}

// Called once a node is depleted: decides whether the ore actually drops
// (dropChance) and whether luck grants a bonus unit. Luck never guarantees
// a drop — it only nudges probability.
export function rollOreDrop(oreDef, luck, rng = Math.random) {
  const chance = Math.min(0.98, oreDef.dropChance + luck * 0.5);
  if (rng() > chance) return 0;
  const bonusChance = Math.min(0.5, luck * 0.4);
  return rng() < bonusChance ? 2 : 1;
}

export function getPickaxeMiningPower(pickaxeId) {
  return PICKAXES[pickaxeId] ?? PICKAXES.stone;
}
