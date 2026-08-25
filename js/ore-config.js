// src/config/ore.js
// Static definition data. In Phase 4+ this mirrors config/ore/ in Firestore
// (read-once, cached client-side — never re-fetched per frame).

export const RARITY = {
  COMMON:    { id: 'common',    label: 'Common',    color: '#9aa0a6', glow: false },
  UNCOMMON:  { id: 'uncommon',  label: 'Uncommon',  color: '#2f6f3e', glow: false },
  RARE:      { id: 'rare',      label: 'Rare',      color: '#3d7fd6', glow: false },
  EPIC:      { id: 'epic',      label: 'Epic',      color: '#8b3fd4', glow: true },
  LEGENDARY: { id: 'legendary', label: 'Legendary',  color: '#d4a72c', glow: true },
  MYTHIC:    { id: 'mythic',    label: 'Mythic',     color: '#b0303a', glow: true },
  TYRANT:    { id: 'tyrant',    label: 'Tyrant',     color: '#141414', glow: true },
  MAGICAL:   { id: 'magical',   label: 'Magical',    color: 'linear-gradient(135deg,#b0303a,#141414,#d4a72c)', glow: true },
};

// area: which mining zone the node can spawn in
export const ORES = {
  copper: { id: 'copper', name: 'Copper Ore', rarity: RARITY.COMMON, basePrice: 4, difficulty: 1, dropChance: 0.9, area: 'early_mine', color: '#c87a44' },
  iron:   { id: 'iron',   name: 'Iron Ore',   rarity: RARITY.COMMON, basePrice: 7, difficulty: 2, dropChance: 0.75, area: 'early_mine', color: '#9a8f86' },
  coal:   { id: 'coal',   name: 'Coal',       rarity: RARITY.COMMON, basePrice: 3, difficulty: 1, dropChance: 0.95, area: 'early_mine', color: '#2b2b2b' },
  tin:    { id: 'tin',    name: 'Tin Ore',    rarity: RARITY.UNCOMMON, basePrice: 9, difficulty: 2, dropChance: 0.6, area: 'early_mine', color: '#c9c9c9' },

  silver:   { id: 'silver',   name: 'Silver Ore',   rarity: RARITY.UNCOMMON, basePrice: 18, difficulty: 3, dropChance: 0.55, area: 'deep_mine', color: '#d7d7e0' },
  gold:     { id: 'gold',     name: 'Gold Ore',     rarity: RARITY.RARE, basePrice: 32, difficulty: 4, dropChance: 0.35, area: 'deep_mine', color: '#e8c23a' },
  platinum: { id: 'platinum', name: 'Platinum Ore', rarity: RARITY.RARE, basePrice: 45, difficulty: 5, dropChance: 0.22, area: 'deep_mine', color: '#bfc9d1' },
  diamond:  { id: 'diamond',  name: 'Diamond',      rarity: RARITY.EPIC, basePrice: 80, difficulty: 6, dropChance: 0.1, area: 'deep_mine', color: '#8fe3f0' },

  // NOTE: these four used to sit in an orphaned 'rare_area' that no map ever
  // spawned nodes in. They now spawn for real in the Crystal Mine (Lv.10)
  // alongside the four brand-new crystal-tier ores below.
  ruby:    { id: 'ruby',    name: 'Ruby',    rarity: RARITY.EPIC,      basePrice: 120, difficulty: 7, dropChance: 0.08, area: 'crystal_mine', color: '#d4304f' },
  sapphire:{ id: 'sapphire',name: 'Sapphire',rarity: RARITY.EPIC,      basePrice: 120, difficulty: 7, dropChance: 0.08, area: 'crystal_mine', color: '#2b5fd6' },
  emerald: { id: 'emerald', name: 'Emerald', rarity: RARITY.LEGENDARY, basePrice: 160, difficulty: 8, dropChance: 0.05, area: 'crystal_mine', color: '#2fae5e' },
  mythril: { id: 'mythril', name: 'Mythril', rarity: RARITY.MYTHIC,    basePrice: 260, difficulty: 9, dropChance: 0.02, area: 'crystal_mine', color: '#7fd8c8' },

  // --- New: Crystal Mine (Lv.10) — 4 new ores ---
  quartz_crystal: { id: 'quartz_crystal', name: 'Quartz Crystal', rarity: RARITY.UNCOMMON, basePrice: 55,  difficulty: 6, dropChance: 0.30,  area: 'crystal_mine', color: '#eaf6ff' },
  opal:           { id: 'opal',           name: 'Opal',           rarity: RARITY.RARE,     basePrice: 95,  difficulty: 7, dropChance: 0.15,  area: 'crystal_mine', color: '#e0c9f0' },
  amethyst:       { id: 'amethyst',       name: 'Amethyst',       rarity: RARITY.EPIC,     basePrice: 130, difficulty: 7, dropChance: 0.08,  area: 'crystal_mine', color: '#9966cc' },
  obsidian_shard: { id: 'obsidian_shard', name: 'Obsidian Shard', rarity: RARITY.EPIC,     basePrice: 140, difficulty: 8, dropChance: 0.07,  area: 'crystal_mine', color: '#1c1c24' },

  // --- New: Molten Mine (Lv.15) — 4 new ores ---
  sulfur_crystal: { id: 'sulfur_crystal', name: 'Sulfur Crystal', rarity: RARITY.UNCOMMON,  basePrice: 60,  difficulty: 9,  dropChance: 0.30,  area: 'molten_mine', color: '#e8d94a' },
  magma_shard:    { id: 'magma_shard',    name: 'Magma Shard',    rarity: RARITY.RARE,      basePrice: 150, difficulty: 10, dropChance: 0.15,  area: 'molten_mine', color: '#ff5a2b' },
  volcanic_glass: { id: 'volcanic_glass', name: 'Volcanic Glass', rarity: RARITY.EPIC,      basePrice: 210, difficulty: 11, dropChance: 0.06,  area: 'molten_mine', color: '#2e1a12' },
  phoenix_ore:    { id: 'phoenix_ore',    name: 'Phoenix Ore',    rarity: RARITY.LEGENDARY, basePrice: 320, difficulty: 13, dropChance: 0.03,  area: 'molten_mine', color: '#ff8c3a' },

  // NOTE: these three used to sit in an orphaned 'ancient_area' that no map
  // ever spawned nodes in. They now spawn for real in the Abyssal Mine
  // (Lv.20) alongside the four brand-new abyssal-tier ores below.
  ancient_ore:  { id: 'ancient_ore',  name: 'Ancient Ore',  rarity: RARITY.TYRANT,  basePrice: 400, difficulty: 10, dropChance: 0.01,  area: 'abyssal_mine', color: '#3a2a1a' },
  magical_ore:  { id: 'magical_ore',  name: 'Magical Ore',  rarity: RARITY.MAGICAL, basePrice: 700, difficulty: 12, dropChance: 0.004, area: 'abyssal_mine', color: '#c23a5a' },
  tyrant_ore:   { id: 'tyrant_ore',   name: 'Tyrant Ore',   rarity: RARITY.TYRANT,  basePrice: 550, difficulty: 11, dropChance: 0.006, area: 'abyssal_mine', color: '#111111' },

  // --- New: Abyssal Mine (Lv.20) — 4 new ores ---
  abyssal_pearl: { id: 'abyssal_pearl', name: 'Abyssal Pearl', rarity: RARITY.EPIC,      basePrice: 230, difficulty: 13, dropChance: 0.05,   area: 'abyssal_mine', color: '#0f3a3a' },
  star_fragment: { id: 'star_fragment', name: 'Star Fragment', rarity: RARITY.LEGENDARY, basePrice: 360, difficulty: 14, dropChance: 0.025,  area: 'abyssal_mine', color: '#cfe8ff' },
  void_shard:    { id: 'void_shard',    name: 'Void Shard',    rarity: RARITY.MYTHIC,    basePrice: 420, difficulty: 14, dropChance: 0.018,  area: 'abyssal_mine', color: '#2a1a3a' },
  chaos_ore:     { id: 'chaos_ore',     name: 'Chaos Ore',     rarity: RARITY.TYRANT,    basePrice: 600, difficulty: 17, dropChance: 0.008,  area: 'abyssal_mine', color: '#3a0f1a' },
};

export function oresInArea(areaId) {
  return Object.values(ORES).filter(o => o.area === areaId);
}
