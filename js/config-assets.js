// src/config/assets.js
// Drop matching PNGs into public/assets/sprites/ with these exact filenames
// and layouts and they'll be picked up automatically — nothing else to wire.
// If a file is missing, the game silently keeps using its procedural
// placeholder shapes (see game/engine.js), so you can add art one file at a
// time.

export const ASSET_BASE = './assets/sprites/';

// tileset.png — single row, 10 tiles, 32x32px each, left to right:
// [0] grass  [1] path  [2] water  [3] wall/rock  [4] stone floor (early_mine)
// [5] deep mine floor  [6] crystal mine floor  [7] molten mine floor
// [8] abyssal mine floor  [9] dungeon floor (abandoned_mine)
// Each mine/dungeon gets its own floor tile (see game/world.js) so the
// biomes read as visually distinct instead of reusing one grey stone
// tile everywhere. If tileset.png is narrower than 10 tiles, engine.js's
// _drawTiles falls back to TILE_COLORS for any tile id past the image's
// edge, same "art is optional" spirit as everything else in this file.
export const TILESET_PATH = ASSET_BASE + 'tileset.png';

// player.png — 32x32px frames, 2 columns x 4 rows.
// Columns: [0] idle/step-A  [1] step-B
// Rows (top to bottom): down, left, right, up  — matches entities/player.js DIRECTIONS order.
export const PLAYER_SHEET_PATH = ASSET_BASE + 'player.png';

// Optional per-ore icons, 16x16 or 32x32px, transparent background.
// Any missing entry just falls back to the current colored-circle node
// (colored using each ore's `color` field in config/ore.js).
// Every key here MUST match an ore id in config/ore.js exactly, or the
// icon will silently never be picked up (see game/engine.js: it loads a
// texture per ORE_ICON_PATHS entry, keyed as `ore_<id>`).
export const ORE_ICON_PATHS = {
  // early_mine (Lv.1)
  copper: ASSET_BASE + 'ore_copper.png',
  iron: ASSET_BASE + 'ore_iron.png',
  coal: ASSET_BASE + 'ore_coal.png',
  tin: ASSET_BASE + 'ore_tin.png',
  // deep_mine (Lv.5)
  silver: ASSET_BASE + 'ore_silver.png',
  gold: ASSET_BASE + 'ore_gold.png',
  platinum: ASSET_BASE + 'ore_platinum.png',
  diamond: ASSET_BASE + 'ore_diamond.png',
  // crystal_mine (Lv.10)
  quartz_crystal: ASSET_BASE + 'ore_quartz_crystal.png',
  opal: ASSET_BASE + 'ore_opal.png',
  amethyst: ASSET_BASE + 'ore_amethyst.png',
  obsidian_shard: ASSET_BASE + 'ore_obsidian_shard.png',
  ruby: ASSET_BASE + 'ore_ruby.png',
  sapphire: ASSET_BASE + 'ore_sapphire.png',
  emerald: ASSET_BASE + 'ore_emerald.png',
  mythril: ASSET_BASE + 'ore_mythril.png',
  // molten_mine (Lv.15)
  sulfur_crystal: ASSET_BASE + 'ore_sulfur_crystal.png',
  magma_shard: ASSET_BASE + 'ore_magma_shard.png',
  volcanic_glass: ASSET_BASE + 'ore_volcanic_glass.png',
  phoenix_ore: ASSET_BASE + 'ore_phoenix_ore.png',
  // abyssal_mine (Lv.20)
  abyssal_pearl: ASSET_BASE + 'ore_abyssal_pearl.png',
  star_fragment: ASSET_BASE + 'ore_star_fragment.png',
  void_shard: ASSET_BASE + 'ore_void_shard.png',
  chaos_ore: ASSET_BASE + 'ore_chaos_ore.png',
  ancient_ore: ASSET_BASE + 'ore_ancient_ore.png',
  magical_ore: ASSET_BASE + 'ore_magical_ore.png',
  tyrant_ore: ASSET_BASE + 'ore_tyrant_ore.png',
};

// Optional per-enemy icons, 32x32px or 48x48px, transparent background.
// Falls back to the current colored-circle enemy (colored via each def's
// `color` field in dungeon/index.js's ENEMY_DEFS) if missing. Keys must
// match an enemy id in dungeon/index.js's ENEMY_DEFS exactly — loaded in
// game/engine.js's constructor as `enemy_<id>` and drawn in _drawEnemies.
export const ENEMY_ICON_PATHS = {
  cave_rat: ASSET_BASE + 'enemy_cave_rat.png',
  miner_zombie: ASSET_BASE + 'enemy_miner_zombie.png',
  stone_golem: ASSET_BASE + 'enemy_stone_golem.png',
  stone_titan: ASSET_BASE + 'enemy_stone_titan.png', // boss — drawn larger, see engine.js
};

// Optional per-landmark icons, 32x32px. Falls back to the current flat-color
// square + label if missing. Keys must match a landmark `type` exactly
// (see game/world.js and the MINE_CHAIN entrance/exit types in game/engine.js).
// ---------------------------------------------------------------------
// UI icons (no emoji anywhere in the game — every glyph the interface
// used to show as an emoji character now renders as a real image from
// public/assets/icons/, sized/tinted with CSS). All SVG, all vector, all
// tiny. Missing files fail silently (broken <img>, no crash) same spirit
// as every other optional asset in this file.
// ---------------------------------------------------------------------
export const ICON_BASE = './assets/icons/';

// Generic chrome icons used across the Forge / Enchant / Dungeon / HUD
// screens in place of the old emoji glyphs.
export const UI_ICON_PATHS = {
  arrowUp: ICON_BASE + 'ui/arrow_up.svg',
  arrowDown: ICON_BASE + 'ui/arrow_down.svg',
  arrowLeft: ICON_BASE + 'ui/arrow_left.svg',
  arrowRight: ICON_BASE + 'ui/arrow_right.svg',
  sword: ICON_BASE + 'ui/sword.svg',
  shield: ICON_BASE + 'ui/shield.svg',
  backpack: ICON_BASE + 'ui/backpack.svg',
  sparkles: ICON_BASE + 'ui/sparkles.svg',
  trophy: ICON_BASE + 'ui/trophy.svg',
  scroll: ICON_BASE + 'ui/scroll.svg',
  star: ICON_BASE + 'ui/star.svg',
  bossMarker: ICON_BASE + 'ui/boss_marker.svg',
  qualityGem: ICON_BASE + 'ui/quality_gem.svg',
  heart: ICON_BASE + 'ui/heart.svg',
  coin: ICON_BASE + 'ui/coin.svg',
  gear: ICON_BASE + 'ui/gear.svg',
  close: ICON_BASE + 'ui/close.svg',
};

// Passive (Tome) icons — keys must match a def id in passives/index.js.
export const PASSIVE_ICON_PATHS = {
  tome_vitality: ICON_BASE + 'passives/tome_vitality.svg',
  tome_might: ICON_BASE + 'passives/tome_might.svg',
  tome_fortune: ICON_BASE + 'passives/tome_fortune.svg',
  tome_haste: ICON_BASE + 'passives/tome_haste.svg',
  tome_resilience: ICON_BASE + 'passives/tome_resilience.svg',
  tome_greed: ICON_BASE + 'passives/tome_greed.svg',
  tome_precision: ICON_BASE + 'passives/tome_precision.svg',
  tome_swiftness: ICON_BASE + 'passives/tome_swiftness.svg',
  tome_ambition: ICON_BASE + 'passives/tome_ambition.svg',
  tome_vampirism: ICON_BASE + 'passives/tome_vampirism.svg',
  tome_warding: ICON_BASE + 'passives/tome_warding.svg',
  tome_insight: ICON_BASE + 'passives/tome_insight.svg',
};

// Skill (Scroll) icons — keys must match a def id in skills/index.js.
export const SKILL_ICON_PATHS = {
  power_surge: ICON_BASE + 'skills/power_surge.svg',
  second_wind: ICON_BASE + 'skills/second_wind.svg',
  stoneskin: ICON_BASE + 'skills/stoneskin.svg',
  berserker_rage: ICON_BASE + 'skills/berserker_rage.svg',
  adrenaline_rush: ICON_BASE + 'skills/adrenaline_rush.svg',
  guardian_ward: ICON_BASE + 'skills/guardian_ward.svg',
};

export const LANDMARK_ICON_PATHS = {
  // village
  blacksmith: ASSET_BASE + 'landmark_blacksmith.png',
  mine_entrance: ASSET_BASE + 'landmark_mine_entrance.png',
  shop: ASSET_BASE + 'landmark_shop.png',
  dungeon_npc: ASSET_BASE + 'landmark_dungeon_npc.png',
  auction_house: ASSET_BASE + 'landmark_auction_house.png',
  storage: ASSET_BASE + 'landmark_storage.png',
  enchanter: ASSET_BASE + 'landmark_enchanter.png',
  spawn: ASSET_BASE + 'landmark_spawn.png',
  // early_mine <-> deep_mine
  mine_exit: ASSET_BASE + 'landmark_mine_exit.png',
  deep_mine_entrance: ASSET_BASE + 'landmark_deep_mine_entrance.png',
  deep_mine_exit: ASSET_BASE + 'landmark_deep_mine_exit.png',
  // deep_mine <-> crystal_mine (Lv.10)
  crystal_mine_entrance: ASSET_BASE + 'landmark_crystal_mine_entrance.png',
  crystal_mine_exit: ASSET_BASE + 'landmark_crystal_mine_exit.png',
  // crystal_mine <-> molten_mine (Lv.15)
  molten_mine_entrance: ASSET_BASE + 'landmark_molten_mine_entrance.png',
  molten_mine_exit: ASSET_BASE + 'landmark_molten_mine_exit.png',
  // molten_mine <-> abyssal_mine (Lv.20)
  abyssal_mine_entrance: ASSET_BASE + 'landmark_abyssal_mine_entrance.png',
  abyssal_mine_exit: ASSET_BASE + 'landmark_abyssal_mine_exit.png',
  // abandoned_mine dungeon
  dungeon_exit: ASSET_BASE + 'landmark_dungeon_exit.png',
};
