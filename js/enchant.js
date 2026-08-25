// src/enchant/index.js
// Enchanting: spend Enchant Fragments (dropped in the dungeon) at the
// Enchanter NPC in the village to permanently strengthen whichever sword or
// armor you have equipped. Pure logic here, no DOM — see enchant-ui.js for
// the interactive panel and inventory/inventory.js for where fragments are
// tracked/spent.

export const MAX_ENCHANT_LEVEL = 10;
export const ENCHANT_BONUS_PER_LEVEL = 0.05; // +5% of the item's own primary stat(s) per level

// Enchant Fragment cost to go from `currentLevel` to `currentLevel + 1`.
// Returns null once the item is already at the enchant cap.
export function enchantFragmentCost(currentLevel = 0) {
  if (currentLevel >= MAX_ENCHANT_LEVEL) return null;
  return (currentLevel + 1) * 3; // 0->1 costs 3, 1->2 costs 6, ... 9->10 costs 30
}

// Flat bonus this item's current enchant level adds on top of its own base
// rolled stats — recomputed live every time combat stats are needed, so
// forging/inventory code never has to remember to "bake it in" anywhere.
export function enchantBonusStats(item) {
  const level = item?.enchantLevel ?? 0;
  if (level <= 0 || !item?.stats) return {};
  const mult = level * ENCHANT_BONUS_PER_LEVEL;
  const bonus = {};
  if (item.type === 'sword') {
    bonus.attack = Math.round((item.stats.attack ?? 0) * mult);
  } else if (item.type === 'armor') {
    bonus.hp = Math.round((item.stats.hp ?? 0) * mult);
    bonus.defense = Math.round((item.stats.defense ?? 0) * mult);
  }
  return bonus;
}

export function applyEnchant(item) {
  item.enchantLevel = (item.enchantLevel ?? 0) + 1;
  return item;
}
