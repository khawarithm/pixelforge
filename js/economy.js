// src/economy/index.js
// NPC pricing per brief section 15/16: value comes from material + rarity +
// quality + stats + special effect (already baked into item.value by
// forging/index.js), then an NPC "haircut" so the shop never pays full
// value — matches "NPC tidak selalu memberikan harga maksimal".

const NPC_SELL_MULTIPLIER_MIN = 0.55;
const NPC_SELL_MULTIPLIER_MAX = 0.80;

export function rollSellMultiplier(rng = Math.random) {
  return NPC_SELL_MULTIPLIER_MIN + rng() * (NPC_SELL_MULTIPLIER_MAX - NPC_SELL_MULTIPLIER_MIN);
}

export function npcOreSellPrice(oreDef, count, rng = Math.random) {
  if (!oreDef) return 0;
  return Math.max(1, Math.round(oreDef.basePrice * count * rollSellMultiplier(rng)));
}

export function npcEquipmentSellPrice(item, rng = Math.random) {
  return Math.max(1, Math.round(item.value * rollSellMultiplier(rng)));
}

// Gold sinks referenced from other modules, collected here so the economy's
// "drains" are easy to audit in one place per the brief's section 26.
export const GOLD_SINKS = {
  dungeonTicket: 30, // mirrors dungeon/index.js DUNGEONS.abandoned_mine.ticketCost (pay-at-the-door price)
  dungeonTicketShopPrice: 25, // small discount for pre-buying at the Shop's Buy tab
  healthPotion: 15, // instantly restores the player to full HP
};
