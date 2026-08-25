// src/quests/daily-quests.js
// Daily Quests — separate from the permanent one-time Quest Log in
// quests.js. 3 objectives are drawn from DAILY_QUEST_POOL and re-rolled
// the moment the real-world calendar date changes (see ensureDailyPeriod),
// which also zeroes Inventory's `dailyStats` counters so progress always
// reflects *this* period only, not lifetime totals. Those counters are
// fed by Inventory's addOre/addGold/recordKill/recordDive/recordEnchant —
// see inventory.js.

import { grantReward } from './quest-rewards.js';

const ACTIVE_COUNT = 3;
const EMPTY_STATS = { oreMined: 0, goldEarned: 0, kills: 0, dives: 0, enchants: 0 };

function dateKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export const DAILY_QUEST_POOL = [
  {
    id: 'daily_mine_30', nameKey: 'daily_mine_30_name', descKey: 'daily_mine_30_desc',
    target: 30, stat: 'oreMined', reward: { type: 'random_ore', amount: 10 },
  },
  {
    id: 'daily_mine_60', nameKey: 'daily_mine_60_name', descKey: 'daily_mine_60_desc',
    target: 60, stat: 'oreMined', reward: { type: 'tome' },
  },
  {
    id: 'daily_gold_150', nameKey: 'daily_gold_150_name', descKey: 'daily_gold_150_desc',
    target: 150, stat: 'goldEarned', reward: { type: 'enchant_fragments', amount: 2 },
  },
  {
    id: 'daily_kill_8', nameKey: 'daily_kill_8_name', descKey: 'daily_kill_8_desc',
    target: 8, stat: 'kills', reward: { type: 'training_fragments', amount: 2 },
  },
  {
    id: 'daily_dive_1', nameKey: 'daily_dive_1_name', descKey: 'daily_dive_1_desc',
    target: 1, stat: 'dives', reward: { type: 'gold', amount: 60 },
  },
  {
    id: 'daily_enchant_1', nameKey: 'daily_enchant_1_name', descKey: 'daily_enchant_1_desc',
    target: 1, stat: 'enchants', reward: { type: 'skill' },
  },
];

const DEFS_BY_ID = new Map(DAILY_QUEST_POOL.map((d) => [d.id, d]));

function rollActiveIds(rng = Math.random) {
  const pool = [...DAILY_QUEST_POOL];
  const chosen = [];
  while (chosen.length < ACTIVE_COUNT && pool.length) {
    const idx = Math.floor(rng() * pool.length);
    chosen.push(pool.splice(idx, 1)[0].id);
  }
  return chosen;
}

// Called both by Inventory's own stat-recording methods and by the UI
// before rendering, so the rollover happens no matter which one runs
// first after midnight — cheap no-op once periodKey already matches.
export function ensureDailyPeriod(inventory) {
  const key = dateKey();
  if (inventory.dailyQuests.periodKey === key) return;
  inventory.dailyQuests = { periodKey: key, activeIds: rollActiveIds(), claimed: [] };
  inventory.dailyStats = { ...EMPTY_STATS };
}

export function activeDailyQuests(inventory) {
  ensureDailyPeriod(inventory);
  return inventory.dailyQuests.activeIds.map((id) => DEFS_BY_ID.get(id)).filter(Boolean);
}

export function dailyQuestProgress(def, inventory) {
  const current = Math.max(0, Math.min(def.target, inventory.dailyStats[def.stat] ?? 0));
  return { current, target: def.target, complete: current >= def.target };
}

export function isDailyQuestClaimed(id, inventory) {
  return inventory.dailyQuests.claimed.includes(id);
}

export function claimDailyQuest(id, inventory) {
  ensureDailyPeriod(inventory);
  const def = DEFS_BY_ID.get(id);
  if (!def || !inventory.dailyQuests.activeIds.includes(id)) return null;
  if (inventory.dailyQuests.claimed.includes(id)) return null;
  if (!dailyQuestProgress(def, inventory).complete) return null;

  inventory.dailyQuests.claimed.push(id);
  grantReward(def.reward, inventory);
  inventory.emit();
  return def;
}
