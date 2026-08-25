// src/game/world.js
// Lightweight tile maps. 0 = grass, 1 = path, 2 = water, 3 = wall/rock,
// 4 = stone floor (early_mine). Every deeper mine/dungeon now gets its own
// floor tile id instead of reusing 4, so each biome reads as visually
// distinct both in the procedural TILE_COLORS fallback and in tileset.png
// (see config/assets.js): 5 = deep_mine, 6 = crystal_mine, 7 = molten_mine,
// 8 = abyssal_mine, 9 = abandoned_mine (dungeon). Kept as flat arrays of
// small ints -> cheap to ship and cheap to render (no DOM, just canvas
// fillRect/drawImage per tile).
export const FLOOR_TILE = {
  early_mine: 4,
  deep_mine: 5,
  crystal_mine: 6,
  molten_mine: 7,
  abyssal_mine: 8,
  abandoned_mine: 9,
};

export const TILE = 32;

function fillRect(map, w, x0, y0, x1, y1, v) {
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      map[y * w + x] = v;
    }
  }
}

function makeVillage() {
  const w = 26, h = 20;
  const tiles = new Uint8Array(w * h).fill(0); // grass
  // paths crossing the village
  fillRect(tiles, w, 0, 9, w - 1, 10, 1);
  fillRect(tiles, w, 12, 0, 13, h - 1, 1);
  // small pond
  fillRect(tiles, w, 2, 2, 5, 4, 2);
  // border rock wall
  fillRect(tiles, w, 0, 0, w - 1, 0, 3);
  fillRect(tiles, w, 0, h - 1, w - 1, h - 1, 3);
  fillRect(tiles, w, 0, 0, 0, h - 1, 3);
  fillRect(tiles, w, w - 1, 0, w - 1, h - 1, 3);

  const landmarks = [
    { id: 'spawn', label: 'Spawn', x: 13, y: 9, type: 'spawn', color: '#5aa9e6' },
    { id: 'blacksmith', label: 'Blacksmith', x: 8, y: 6, type: 'blacksmith', color: '#b5651d' },
    { id: 'mine_entrance', label: 'Mining Entrance', x: 4, y: 13, type: 'mine_entrance', color: '#6b6b6b' },
    { id: 'shop', label: 'Shop', x: 18, y: 6, type: 'shop', color: '#3d8b52' },
    { id: 'dungeon_npc', label: 'Dungeon Board', x: 21, y: 13, type: 'dungeon_npc', color: '#7a3fd4' },
    { id: 'auction_house', label: 'Auction House', x: 8, y: 15, type: 'auction_house', color: '#d4a72c' },
    { id: 'storage', label: 'Storage', x: 18, y: 15, type: 'storage', color: '#8a8a8a' },
    { id: 'enchanter', label: 'Enchanter', x: 21, y: 6, type: 'enchanter', color: '#7fd8c8' },
  ];

  return { id: 'village', w, h, tiles, landmarks, spawn: { x: 13 * TILE + 16, y: 9 * TILE + 40 } };
}

function makeEarlyMine() {
  const w = 22, h = 16;
  const tiles = new Uint8Array(w * h).fill(4); // stone floor
  fillRect(tiles, w, 0, 0, w - 1, 0, 3);
  fillRect(tiles, w, 0, h - 1, w - 1, h - 1, 3);
  fillRect(tiles, w, 0, 0, 0, h - 1, 3);
  fillRect(tiles, w, w - 1, 0, w - 1, h - 1, 3);

  // scattered pillars for visual interest / light obstacles
  const pillars = [[5, 4], [9, 9], [15, 5], [17, 11], [7, 12]];
  for (const [x, y] of pillars) tiles[y * w + x] = 3;

  // ore node spawn points -> oreId, tile x, tile y
  const oreNodes = [
    { oreId: 'copper', x: 3, y: 3 }, { oreId: 'copper', x: 4, y: 8 },
    { oreId: 'copper', x: 12, y: 3 }, { oreId: 'copper', x: 19, y: 8 },
    { oreId: 'iron', x: 7, y: 3 }, { oreId: 'iron', x: 14, y: 9 },
    { oreId: 'iron', x: 3, y: 12 }, { oreId: 'iron', x: 18, y: 4 },
    { oreId: 'coal', x: 9, y: 6 }, { oreId: 'coal', x: 16, y: 12 },
    { oreId: 'coal', x: 2, y: 6 }, { oreId: 'coal', x: 11, y: 13 },
    { oreId: 'tin', x: 6, y: 10 }, { oreId: 'tin', x: 19, y: 13 },
  ];

  const landmarks = [
    { id: 'mine_exit', label: 'Exit to Village', x: 1, y: 8, type: 'mine_exit', color: '#5aa9e6' },
    { id: 'deep_mine_entrance', label: 'Deep Mine (Lv.5)', x: 20, y: 8, type: 'deep_mine_entrance', color: '#2a2833' },
  ];

  return { id: 'early_mine', w, h, tiles, landmarks, oreNodes, spawn: { x: 3 * TILE + 16, y: 8 * TILE + 16 } };
}

function makeDeepMine() {
  const w = 24, h = 18;
  const tiles = new Uint8Array(w * h).fill(FLOOR_TILE.deep_mine); // deep mine floor
  fillRect(tiles, w, 0, 0, w - 1, 0, 3);
  fillRect(tiles, w, 0, h - 1, w - 1, h - 1, 3);
  fillRect(tiles, w, 0, 0, 0, h - 1, 3);
  fillRect(tiles, w, w - 1, 0, w - 1, h - 1, 3);

  const pillars = [[6, 4], [11, 8], [16, 4], [8, 13], [18, 12], [4, 9]];
  for (const [x, y] of pillars) tiles[y * w + x] = 3;

  const oreNodes = [
    { oreId: 'silver', x: 3, y: 3 }, { oreId: 'silver', x: 5, y: 10 },
    { oreId: 'silver', x: 14, y: 3 }, { oreId: 'silver', x: 20, y: 9 },
    { oreId: 'gold', x: 9, y: 3 }, { oreId: 'gold', x: 15, y: 9 },
    { oreId: 'gold', x: 4, y: 14 }, { oreId: 'gold', x: 19, y: 5 },
    { oreId: 'platinum', x: 12, y: 12 }, { oreId: 'platinum', x: 21, y: 14 },
    { oreId: 'platinum', x: 7, y: 6 },
    { oreId: 'diamond', x: 17, y: 15 }, { oreId: 'diamond', x: 10, y: 5 },
  ];

  const landmarks = [
    { id: 'deep_mine_exit', label: 'Exit to Early Mine', x: 1, y: 9, type: 'deep_mine_exit', color: '#5aa9e6' },
    { id: 'crystal_mine_entrance', label: 'Crystal Mine (Lv.10)', x: 22, y: 9, type: 'crystal_mine_entrance', color: '#7fd8c8' },
  ];

  return { id: 'deep_mine', w, h, tiles, landmarks, oreNodes, spawn: { x: 3 * TILE + 16, y: 9 * TILE + 16 } };
}

function makeCrystalMine() {
  // Deeper than deep_mine: bigger footprint, denser ore spread, more pillars.
  const w = 26, h = 18;
  const tiles = new Uint8Array(w * h).fill(FLOOR_TILE.crystal_mine); // crystal mine floor
  fillRect(tiles, w, 0, 0, w - 1, 0, 3);
  fillRect(tiles, w, 0, h - 1, w - 1, h - 1, 3);
  fillRect(tiles, w, 0, 0, 0, h - 1, 3);
  fillRect(tiles, w, w - 1, 0, w - 1, h - 1, 3);

  const pillars = [[5, 4], [10, 9], [15, 4], [20, 9], [8, 14], [18, 14], [12, 6]];
  for (const [x, y] of pillars) tiles[y * w + x] = 3;

  const oreNodes = [
    { oreId: 'quartz_crystal', x: 3, y: 3 }, { oreId: 'quartz_crystal', x: 6, y: 11 },
    { oreId: 'quartz_crystal', x: 21, y: 4 }, { oreId: 'quartz_crystal', x: 23, y: 12 },
    { oreId: 'opal', x: 4, y: 8 }, { oreId: 'opal', x: 13, y: 3 }, { oreId: 'opal', x: 19, y: 14 },
    { oreId: 'amethyst', x: 9, y: 3 }, { oreId: 'amethyst', x: 16, y: 11 }, { oreId: 'amethyst', x: 2, y: 14 },
    { oreId: 'obsidian_shard', x: 14, y: 15 }, { oreId: 'obsidian_shard', x: 22, y: 6 },
    { oreId: 'ruby', x: 7, y: 6 }, { oreId: 'ruby', x: 17, y: 8 },
    { oreId: 'sapphire', x: 11, y: 13 }, { oreId: 'sapphire', x: 23, y: 3 },
    { oreId: 'emerald', x: 3, y: 10 }, { oreId: 'emerald', x: 20, y: 3 },
    { oreId: 'mythril', x: 12, y: 9 },
  ];

  const landmarks = [
    { id: 'crystal_mine_exit', label: 'Exit to Deep Mine', x: 1, y: 9, type: 'crystal_mine_exit', color: '#5aa9e6' },
    { id: 'molten_mine_entrance', label: 'Molten Mine (Lv.15)', x: 24, y: 9, type: 'molten_mine_entrance', color: '#ff5a2b' },
  ];

  return { id: 'crystal_mine', w, h, tiles, landmarks, oreNodes, spawn: { x: 3 * TILE + 16, y: 9 * TILE + 16 } };
}

function makeMoltenMine() {
  // Deeper still: even bigger footprint than crystal_mine.
  const w = 28, h = 20;
  const tiles = new Uint8Array(w * h).fill(FLOOR_TILE.molten_mine); // molten mine floor
  fillRect(tiles, w, 0, 0, w - 1, 0, 3);
  fillRect(tiles, w, 0, h - 1, w - 1, h - 1, 3);
  fillRect(tiles, w, 0, 0, 0, h - 1, 3);
  fillRect(tiles, w, w - 1, 0, w - 1, h - 1, 3);

  const pillars = [[6, 5], [12, 10], [18, 5], [22, 15], [9, 15], [16, 15], [24, 8], [4, 10]];
  for (const [x, y] of pillars) tiles[y * w + x] = 3;

  const oreNodes = [
    { oreId: 'sulfur_crystal', x: 3, y: 3 }, { oreId: 'sulfur_crystal', x: 8, y: 12 },
    { oreId: 'sulfur_crystal', x: 20, y: 4 }, { oreId: 'sulfur_crystal', x: 25, y: 13 },
    { oreId: 'magma_shard', x: 5, y: 9 }, { oreId: 'magma_shard', x: 15, y: 4 }, { oreId: 'magma_shard', x: 21, y: 12 },
    { oreId: 'volcanic_glass', x: 11, y: 8 }, { oreId: 'volcanic_glass', x: 19, y: 17 },
    { oreId: 'phoenix_ore', x: 14, y: 13 },
  ];

  const landmarks = [
    { id: 'molten_mine_exit', label: 'Exit to Crystal Mine', x: 1, y: 9, type: 'molten_mine_exit', color: '#5aa9e6' },
    { id: 'abyssal_mine_entrance', label: 'Abyssal Mine (Lv.20)', x: 26, y: 9, type: 'abyssal_mine_entrance', color: '#2a1a3a' },
  ];

  return { id: 'molten_mine', w, h, tiles, landmarks, oreNodes, spawn: { x: 3 * TILE + 16, y: 9 * TILE + 16 } };
}

function makeAbyssalMine() {
  // Deepest floor: largest footprint, sparse but high-value nodes.
  const w = 30, h = 22;
  const tiles = new Uint8Array(w * h).fill(FLOOR_TILE.abyssal_mine); // abyssal mine floor
  fillRect(tiles, w, 0, 0, w - 1, 0, 3);
  fillRect(tiles, w, 0, h - 1, w - 1, h - 1, 3);
  fillRect(tiles, w, 0, 0, 0, h - 1, 3);
  fillRect(tiles, w, w - 1, 0, w - 1, h - 1, 3);

  const pillars = [[6, 5], [13, 11], [20, 5], [25, 16], [9, 17], [17, 17], [27, 9], [4, 11]];
  for (const [x, y] of pillars) tiles[y * w + x] = 3;

  const oreNodes = [
    { oreId: 'abyssal_pearl', x: 3, y: 3 }, { oreId: 'abyssal_pearl', x: 9, y: 13 }, { oreId: 'abyssal_pearl', x: 22, y: 6 },
    { oreId: 'star_fragment', x: 6, y: 9 }, { oreId: 'star_fragment', x: 19, y: 15 },
    { oreId: 'void_shard', x: 14, y: 5 }, { oreId: 'void_shard', x: 25, y: 12 },
    { oreId: 'ancient_ore', x: 11, y: 17 },
    { oreId: 'magical_ore', x: 17, y: 8 },
    { oreId: 'tyrant_ore', x: 23, y: 18 },
    { oreId: 'chaos_ore', x: 15, y: 11 },
  ];

  const landmarks = [
    { id: 'abyssal_mine_exit', label: 'Exit to Molten Mine', x: 1, y: 9, type: 'abyssal_mine_exit', color: '#5aa9e6' },
  ];

  return { id: 'abyssal_mine', w, h, tiles, landmarks, oreNodes, spawn: { x: 3 * TILE + 16, y: 9 * TILE + 16 } };
}

function makeAbandonedMineDungeon() {
  const w = 26, h = 20;
  const tiles = new Uint8Array(w * h).fill(FLOOR_TILE.abandoned_mine); // dungeon floor
  fillRect(tiles, w, 0, 0, w - 1, 0, 3);
  fillRect(tiles, w, 0, h - 1, w - 1, h - 1, 3);
  fillRect(tiles, w, 0, 0, 0, h - 1, 3);
  fillRect(tiles, w, w - 1, 0, w - 1, h - 1, 3);
  // narrow corridor separating the entry hall from the boss room
  fillRect(tiles, w, 18, 0, 18, 7, 3);
  fillRect(tiles, w, 18, 12, 18, h - 1, 3);

  const pillars = [[6, 5], [10, 12], [14, 4], [4, 15], [22, 5], [22, 14]];
  for (const [x, y] of pillars) tiles[y * w + x] = 3;

  const landmarks = [
    { id: 'dungeon_exit', label: 'Retreat to Village', x: 1, y: 9, type: 'dungeon_exit', color: '#5aa9e6' },
  ];

  // Regular enemy spawns in the main hall; boss guards the sealed room past
  // the corridor gap at x=18 (y 8-11).
  const enemySpawns = [
    { enemyId: 'cave_rat', x: 5, y: 9 },
    { enemyId: 'cave_rat', x: 9, y: 4 },
    { enemyId: 'miner_zombie', x: 8, y: 14 },
    { enemyId: 'miner_zombie', x: 13, y: 9 },
    { enemyId: 'stone_golem', x: 12, y: 16 },
    { enemyId: 'stone_golem', x: 15, y: 2 },
  ];
  const bossSpawn = { x: 22, y: 9 };

  return {
    id: 'abandoned_mine', w, h, tiles, landmarks, enemySpawns, bossSpawn,
    spawn: { x: 3 * TILE + 16, y: 9 * TILE + 16 },
  };
}

export const WORLDS = {
  village: makeVillage(),
  early_mine: makeEarlyMine(),
  deep_mine: makeDeepMine(),
  crystal_mine: makeCrystalMine(),
  molten_mine: makeMoltenMine(),
  abyssal_mine: makeAbyssalMine(),
  abandoned_mine: makeAbandonedMineDungeon(),
};

export const TILE_COLORS = {
  0: '#3a6b3a', // grass
  1: '#8a7250', // path
  2: '#2f5fa0', // water
  3: '#4a4a4a', // wall/rock
  4: '#5a5248', // stone floor (early_mine)
  5: '#3a4454', // deep mine floor — cool slate blue
  6: '#2e4048', // crystal mine floor — teal-tinted stone
  7: '#3a221a', // molten mine floor — scorched volcanic brown-red
  8: '#1e1428', // abyssal mine floor — deep void purple-black
  9: '#463c30', // dungeon floor (abandoned_mine) — dusty ruin brown
};
