// src/economy/auto-drill.js
import { AUTO_DRILLS } from './pickaxe-config.js';
import { oresInArea } from './ore-config.js';

// Cached per area so repeated ticks don't re-filter config/ore.js every call.
const orePoolCache = new Map();
function getDrillOrePool(drillId) {
  const def = getDrillDef(drillId);
  const area = def.orePoolArea ?? 'early_mine';
  if (!orePoolCache.has(area)) orePoolCache.set(area, oresInArea(area));
  return orePoolCache.get(area);
}

export function getDrillDef(drillId) {
  return AUTO_DRILLS[drillId] ?? AUTO_DRILLS.basic;
}

function rollDrillOre(pool, rng = Math.random) {
  // Weighted toward the more common ores, same flavor as natural mining nodes.
  const weights = pool.map((o) => 1 / (o.difficulty || 1));
  const total = weights.reduce((a, b) => a + b, 0);
  let r = rng() * total;
  for (let i = 0; i < pool.length; i++) {
    r -= weights[i];
    if (r <= 0) return pool[i].id;
  }
  return pool[0].id;
}

// Called once at boot with seconds elapsed since last save. Result is capped
// by storageCapacity so offline reward can't outgrow manual mining — per the
// brief's explicit "jangan membuat offline reward terlalu besar" warning.
export function computeOfflineMining(drill, elapsedSeconds, luck = 0, rng = Math.random) {
  const def = getDrillDef(drill.id);
  const pool = getDrillOrePool(drill.id);
  const hours = Math.max(0, elapsedSeconds) / 3600;
  const rawAmount = Math.floor(def.offlineRatePerHour * hours * (1 + luck * 0.3));
  const amount = Math.max(0, Math.min(def.storageCapacity, rawAmount));
  const ore = {};
  for (let i = 0; i < amount; i++) {
    const id = rollDrillOre(pool, rng);
    ore[id] = (ore[id] ?? 0) + 1;
  }
  return { ore, total: amount, capped: rawAmount > def.storageCapacity };
}

// Slow passive trickle while the game is actually open — separate from the
// offline lump sum above. One instance per active drill; recreate if the
// drill's id changes (upgrade/replacement).
export class OnlineDrillTicker {
  constructor(drillId) {
    this.drillId = drillId;
    this.accumSeconds = 0;
  }

  update(dt, luck, rng = Math.random) {
    const def = getDrillDef(this.drillId);
    const secondsPerOre = 3600 / Math.max(1, def.offlineRatePerHour * (1 + luck * 0.3));
    this.accumSeconds += dt;
    if (this.accumSeconds >= secondsPerOre) {
      this.accumSeconds -= secondsPerOre;
      return rollDrillOre(getDrillOrePool(this.drillId), rng);
    }
    return null;
  }
}
