// src/config/pickaxe.js
// Base stats. Final rolled stats get small variance applied at acquire-time
// (see systems/mining.js -> rollPickaxeVariance) so progression isn't fully linear.
// levelReq gates purchase in the NPC Shop's Buy tab (economy/shop-ui.js),
// loosely matching the level needed to reach the mine floor that pickaxe
// tier is meant for.

export const PICKAXES = {
  stone: {
    id: 'stone', name: 'Stone Pickaxe', tier: 0, levelReq: 0,
    miningSpeed: 1.0, luck: 0.0, price: 0, rarity: 'common',
  },
  copper: {
    id: 'copper', name: 'Copper Pickaxe', tier: 1, levelReq: 0,
    miningSpeed: 1.15, luck: 0.02, price: 60, rarity: 'common',
  },
  iron: {
    id: 'iron', name: 'Iron Pickaxe', tier: 2, levelReq: 5,
    miningSpeed: 1.25, luck: 0.05, price: 180, rarity: 'uncommon',
  },
  gold: {
    id: 'gold', name: 'Gold Pickaxe', tier: 3, levelReq: 10,
    miningSpeed: 1.55, luck: 0.10, price: 420, rarity: 'rare',
  },
  diamond: {
    // Buffed from 2.0/0.15 — the last "mid-game" pickaxe before the
    // Mythic/Tyrant tier gets a small nudge so the jump to Mythril isn't as
    // steep a cliff.
    id: 'diamond', name: 'Diamond Pickaxe', tier: 4, levelReq: 15,
    miningSpeed: 2.15, luck: 0.17, price: 950, rarity: 'epic',
  },
  mythril: {
    // Buffed from 3.3/0.33 (itself already buffed once from 3.0/0.30):
    // node HP scales up faster through the mines than pickaxe speed used
    // to (early-game nodes: 3-5hp, abyssal-mine nodes: 15-20hp), so by the
    // time you can afford Mythril it was already falling behind
    // chaos_ore-tier nodes. This closes a bit more of that gap.
    id: 'mythril', name: 'Mythril Pickaxe', tier: 5, levelReq: 20,
    miningSpeed: 3.6, luck: 0.36, price: 2400, rarity: 'mythic',
  },
  // True end-game pickaxe, priced above Mythril and gated behind the same
  // Lv.20 requirement (you'll need real Abyssal Mine time to afford it, not
  // just to unlock it). Buffed from 4.6/0.42 so it pulls further ahead of
  // Mythril on chaos_ore (20hp, the hardest node in the game) instead of
  // the two feeling close enough to make the price gap not worth it.
  voidforged: {
    id: 'voidforged', name: 'Voidforged Pickaxe', tier: 6, levelReq: 20,
    miningSpeed: 5.1, luck: 0.46, price: 6800, rarity: 'tyrant',
  },
};

// Auto Drill tiers. orePoolArea determines which mine floor's ore table the
// drill draws from while ticking (see economy/auto-drill.js) — a stronger
// drill reaches deeper, more valuable ore, same as the player mining by
// hand would need to travel deeper for it. levelReq gates purchase in the
// Shop's Buy tab, same convention as pickaxes and the mine floors themselves.
export const AUTO_DRILLS = {
  basic: {
    id: 'basic', name: 'Basic Auto Drill', tier: 1, levelReq: 0,
    miningSpeed: 1.0, luck: 0.0,
    storageCapacity: 150,
    offlineRatePerHour: 30, // ore/hour, capped by storageCapacity
    price: 800,
    orePoolArea: 'early_mine',
  },
  advanced: {
    id: 'advanced', name: 'Advanced Auto Drill', tier: 2, levelReq: 5,
    miningSpeed: 1.4, luck: 0.05,
    storageCapacity: 300,
    offlineRatePerHour: 60,
    price: 2200,
    orePoolArea: 'deep_mine',
  },
  master: {
    id: 'master', name: 'Master Auto Drill', tier: 3, levelReq: 10,
    miningSpeed: 1.9, luck: 0.10,
    storageCapacity: 500,
    offlineRatePerHour: 100,
    price: 5500,
    orePoolArea: 'crystal_mine',
  },
  quantum: {
    id: 'quantum', name: 'Quantum Auto Drill', tier: 4, levelReq: 15,
    miningSpeed: 2.6, luck: 0.18,
    storageCapacity: 800,
    offlineRatePerHour: 160,
    price: 12000,
    orePoolArea: 'molten_mine',
  },
  singularity: {
    id: 'singularity', name: 'Singularity Auto Drill', tier: 5, levelReq: 20,
    miningSpeed: 3.5, luck: 0.28,
    storageCapacity: 1200,
    offlineRatePerHour: 240,
    price: 26000,
    orePoolArea: 'abyssal_mine',
  },
};
