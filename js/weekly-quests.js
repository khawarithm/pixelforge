// src/quests/weekly-quests.js
// Weekly Quests — same shape as daily-quests.js (3 active objectives,
// re-rolled on rollover, tracked against period-scoped counters), just on
// an ISO-week clock and with bigger targets/rewards. See daily-quests.js
// for the full design notes; kept as a separate module (rather than one
// generic "timed quests" factory) so each period's pool/targets/rewards
// stay easy to tune independently.

import { grantReward } from './quest-rewards.js';

const ACTIVE_COUNT = 3;
const EMPTY_STATS = { oreMined: 0, goldEarned: 0, kills: 0, dives: 0, enchants: 0 };

// Standard ISO-8601 week key (Mon-start, week containing the year's first
// Thursday is week 1) so the period boundary lands on the same real-world
// day regardless of when in the week the player happens to log in.
function weekKey(d = new Date()) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = (date.getUTCDay() + 6) % 7; // Mon=0 .. Sun=6
  date.setUTCDate(date.getUTCDate() - dayNum + 3);
  const firstThursday = new Date(Date.UTC(date.getUTCFullYear(), 0, 4));
  const firstThursdayDayNum = (firstThursday.getUTCDay() + 6) % 7;
  const week = 1 + Math.round(((date - firstThursday) / 86400000 - 3 + firstThursdayDayNum) / 7);
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

export const WEEKLY_QUEST_POOL = [
  {
    id: 'weekly_mine_300', nameKey: 'weekly_mine_300_name', descKey: 'weekly_mine_300_desc',
    target: 300, stat: 'oreMined', reward: { type: 'random_ore', amount: 40 },
  },
  {
    id: 'weekly_mine_600', nameKey: 'weekly_mine_600_name', descKey: 'weekly_mine_600_desc',
    target: 600, stat: 'oreMined', reward: { type: 'skill', quality: 'superior' },
  },
  {
    id: 'weekly_gold_1000', nameKey: 'weekly_gold_1000_name', descKey: 'weekly_gold_1000_desc',
    target: 1000, stat: 'goldEarned', reward: { type: 'enchant_fragments', amount: 8 },
  },
  {
    id: 'weekly_kill_40', nameKey: 'weekly_kill_40_name', descKey: 'weekly_kill_40_desc',
    target: 40, stat: 'kills', reward: { type: 'training_fragments', amount: 8 },
  },
  {
    id: 'weekly_dive_5', nameKey: 'weekly_dive_5_name', descKey: 'weekly_dive_5_desc',
    target: 5, stat: 'dives', reward: { type: 'dungeon_ticket', amount: 2 },
  },
  {
    id: 'weekly_enchant_3', nameKey: 'weekly_enchant_3_name', descKey: 'weekly_enchant_3_desc',
    target: 3, stat: 'enchants', reward: { type: 'tome', quality: 'superior' },
  },
];

const DEFS_BY_ID = new Map(WEEKLY_QUEST_POOL.map((d) => [d.id, d]));

function rollActiveIds(rng = Math.random) {
  const pool = [...WEEKLY_QUEST_POOL];
  const chosen = [];
  while (chosen.length < ACTIVE_COUNT && pool.length) {
    const idx = Math.floor(rng() * pool.length);
    chosen.push(pool.splice(idx, 1)[0].id);
  }
  return chosen;
}

export function ensureWeeklyPeriod(inventory) {
  const key = weekKey();
  if (inventory.weeklyQuests.periodKey === key) return;
  inventory.weeklyQuests = { periodKey: key, activeIds: rollActiveIds(), claimed: [] };
  inventory.weeklyStats = { ...EMPTY_STATS };
}

export function activeWeeklyQuests(inventory) {
  ensureWeeklyPeriod(inventory);
  return inventory.weeklyQuests.activeIds.map((id) => DEFS_BY_ID.get(id)).filter(Boolean);
}

export function weeklyQuestProgress(def, inventory) {
  const current = Math.max(0, Math.min(def.target, inventory.weeklyStats[def.stat] ?? 0));
  return { current, target: def.target, complete: current >= def.target };
}

export function isWeeklyQuestClaimed(id, inventory) {
  return inventory.weeklyQuests.claimed.includes(id);
}

export function claimWeeklyQuest(id, inventory) {
  ensureWeeklyPeriod(inventory);
  const def = DEFS_BY_ID.get(id);
  if (!def || !inventory.weeklyQuests.activeIds.includes(id)) return null;
  if (inventory.weeklyQuests.claimed.includes(id)) return null;
  if (!weeklyQuestProgress(def, inventory).complete) return null;

  inventory.weeklyQuests.claimed.push(id);
  grantReward(def.reward, inventory);
  inventory.emit();
  return def;
}
