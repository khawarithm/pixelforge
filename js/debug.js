// src/debug/index.js
// Debug Mode — a hidden developer console, reachable two ways:
//   1) entering the exact username "*/debug;;" at the name prompt, or
//   2) unlocking the "The End of All" achievement (Level 120 + floor 100
//      cleared in the Abandoned Mine) — see src/achievements/index.js.
// Bypasses normal progression entirely: no need to actually mine, fight,
// or level up — just type a command. Everything here only ever mutates
// the Inventory through its normal public methods (addGold, addXp,
// addOre, addPassive, addSkill, setPickaxeId, addEnchantFragments, ...)
// and the Engine through its own public debugSetFloor() method, so the
// rest of the game (HUD, save file, combat stats) reacts exactly like it
// would to a normal drop — there's no separate "debug state" to fall out
// of sync.

import { ORES } from './ore-config.js';
import { PICKAXES } from './pickaxe-config.js';
import { PASSIVE_DEFS } from './passives.js';
import { SKILL_DEFS } from './skills.js';
import { QUALITY_ORDER, qualityName } from './quality.js';
import { ACHIEVEMENT_DEFS, forceUnlockAchievement } from './achievements.js';
import { QUEST_DEFS, questProgress, isQuestClaimed } from './quests.js';
import { t } from './i18n.js';

export const DEBUG_USERNAME = '*/debug;;';

export function isDebugUsername(name) {
  return (name ?? '').trim() === DEBUG_USERNAME;
}

// Every "gettable" item id, grouped by category, for both `list item` and
// for resolving `get item <id> <qty>`.
function itemRegistry() {
  return {
    ore: Object.values(ORES).map((o) => ({ id: o.id, label: o.name })),
    pickaxe: Object.values(PICKAXES).map((p) => ({ id: p.id, label: p.name })),
    passive: Object.values(PASSIVE_DEFS).map((p) => ({ id: p.id, label: p.name })),
    skill: Object.values(SKILL_DEFS).map((s) => ({ id: s.id, label: s.name })),
  };
}

export function listItemsText() {
  const reg = itemRegistry();
  const lines = [];
  lines.push('--- Ore (get item <id> <qty>) ---');
  for (const { id, label } of reg.ore) lines.push(`  ${id}  (${label})`);
  lines.push('--- Pickaxe (get item <id> — qty ignored) ---');
  for (const { id, label } of reg.pickaxe) lines.push(`  ${id}  (${label})`);
  lines.push('--- Passive / Tome (get item <id> <qty> [quality]) ---');
  for (const { id, label } of reg.passive) lines.push(`  ${id}  (${label})`);
  lines.push('--- Skill / Scroll (get item <id> <qty> [quality]) ---');
  for (const { id, label } of reg.skill) lines.push(`  ${id}  (${label})`);
  lines.push('--- Quality tiers (lowest -> highest) ---');
  lines.push('  ' + QUALITY_ORDER.join(', '));
  return lines.join('\n');
}

export function listAchievementsText(inventory) {
  const lines = ['--- Achievements (unlock achievement <id> | "all") ---'];
  for (const def of ACHIEVEMENT_DEFS) {
    const status = inventory.unlockedAchievements.has(def.id) ? '[UNLOCKED]' : '[locked]';
    lines.push(`  ${status}  ${def.id}  — ${t(def.nameKey)}`);
  }
  return lines.join('\n');
}

export function listQuestsText(inventory) {
  const lines = ['--- Quests ---'];
  for (const def of QUEST_DEFS) {
    const claimed = isQuestClaimed(def.id, inventory);
    const { current, target } = questProgress(def, inventory);
    const status = claimed ? '[claimed]' : current >= target ? '[ready]' : '[in progress]';
    lines.push(`  ${status}  ${def.id}  — ${t(def.nameKey)} (${current}/${target})`);
  }
  return lines.join('\n');
}

// Full command reference — shown on "help" / "list command", and once at
// console startup.
export function helpText() {
  return [
    t('debug_help_title'),
    t('debug_help_money'),
    t('debug_help_level'),
    t('debug_help_setfloor'),
    t('debug_help_enchant_token'),
    t('debug_help_training_token'),
    t('debug_help_get_item'),
    t('debug_help_list_item'),
    t('debug_help_list_achievements'),
    t('debug_help_list_quests'),
    t('debug_help_unlock_achievement'),
    t('debug_help_help'),
  ].join('\n');
}

// Turns "add money(500)" / "add money 500" / "add money: 500" into
// ['add','money','500'] — forgiving of parens/commas/colons/casing so the
// command bar doesn't need to be typed exactly.
function tokenize(raw) {
  return raw
    .toLowerCase()
    .replace(/[()]/g, ' ')
    .replace(/[,:;]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

function result(ok, message) {
  return { ok, message };
}

// Executes one debug command against a live Inventory instance (and,
// optionally, the live Engine — needed only for `setfloor`). Returns
// { ok, message } — message is always shown in the console log, ok just
// controls the log line's color.
export function runDebugCommand(raw, inventory, engine) {
  const tokens = tokenize(raw);
  if (tokens.length === 0) return result(false, 'Empty command.');

  const [a, b, ...rest] = tokens;

  // add money (nominal)
  if (a === 'add' && b === 'money') {
    const amount = parseInt(rest[0], 10);
    if (!Number.isFinite(amount)) return result(false, 'Usage: add money (nominal)');
    inventory.addGold(amount);
    return result(true, `+${amount} gold. Total: ${inventory.gold}g`);
  }

  // add level (level)
  if (a === 'add' && b === 'level') {
    const n = parseInt(rest[0], 10);
    if (!Number.isFinite(n) || n === 0) return result(false, 'Usage: add level (level)');
    if (n > 0) {
      for (let i = 0; i < n; i++) inventory.addXp(inventory.xpToNextLevel());
    } else {
      inventory.level = Math.max(1, inventory.level + n);
      inventory.xp = 0;
      inventory.emit();
    }
    return result(true, `Level is now ${inventory.level}.`);
  }

  // add enchant token (jumlah) — grants Enchant Fragments
  if (a === 'add' && b === 'enchant' && rest[0] === 'token') {
    const amount = parseInt(rest[1], 10);
    if (!Number.isFinite(amount) || amount === 0) return result(false, t('debug_enchant_token_usage'));
    inventory.addEnchantFragments(amount);
    return result(true, t('debug_enchant_token_ok', { amount, total: inventory.enchantFragments }));
  }

  // add training token (jumlah) — grants Training Fragments
  if (a === 'add' && b === 'training' && rest[0] === 'token') {
    const amount = parseInt(rest[1], 10);
    if (!Number.isFinite(amount) || amount === 0) return result(false, t('debug_training_token_usage'));
    inventory.addTrainingFragments(amount);
    return result(true, t('debug_training_token_ok', { amount, total: inventory.trainingFragments }));
  }

  // setfloor (lantai dungeon) — jump the current Abandoned Mine dive to a
  // specific floor. Delegates to Engine#debugSetFloor so floor-scaled
  // enemies actually respawn if you're standing in the dungeon right now.
  if (a === 'setfloor') {
    const n = parseInt(b, 10);
    if (!Number.isFinite(n) || n < 1) return result(false, t('debug_setfloor_usage'));
    if (!engine) return result(false, 'Debug console has no engine reference — cannot set floor.');
    const applied = engine.debugSetFloor(n);
    return result(true, t('debug_setfloor_ok', { floor: applied }));
  }

  // list item
  if (a === 'list' && b === 'item') {
    return result(true, listItemsText());
  }

  // list achievement
  if (a === 'list' && (b === 'achievement' || b === 'achievements')) {
    return result(true, listAchievementsText(inventory));
  }

  // list quest
  if (a === 'list' && (b === 'quest' || b === 'quests')) {
    return result(true, listQuestsText(inventory));
  }

  // list command / help
  if ((a === 'list' && b === 'command') || a === 'help') {
    return result(true, helpText());
  }

  // unlock achievement (id) | all
  if (a === 'unlock' && b === 'achievement') {
    const id = rest[0];
    if (!id) return result(false, t('debug_unlock_achievement_usage'));
    if (id === 'all') {
      for (const def of ACHIEVEMENT_DEFS) forceUnlockAchievement(def.id, inventory);
      inventory.emit();
      return result(true, t('debug_unlock_achievement_all'));
    }
    const def = forceUnlockAchievement(id, inventory);
    if (!def) return result(false, t('debug_unlock_achievement_unknown', { id }));
    inventory.emit();
    return result(true, t('debug_unlock_achievement_ok', { name: t(def.nameKey) }));
  }

  // get item (id) (qty) [quality]
  if (a === 'get' && b === 'item') {
    const id = rest[0];
    if (!id) return result(false, 'Usage: get item (id) (qty)');
    const qty = Math.max(1, parseInt(rest[1], 10) || 1);
    const qualityArg = rest[2] && QUALITY_ORDER.includes(rest[2]) ? rest[2] : 'perfect';

    if (ORES[id]) {
      inventory.addOre(id, qty);
      return result(true, `+${qty} ${ORES[id].name} (${id}).`);
    }
    if (PICKAXES[id]) {
      inventory.setPickaxeId(id);
      return result(true, `Equipped ${PICKAXES[id].name} (${id}).`);
    }
    if (PASSIVE_DEFS[id]) {
      for (let i = 0; i < qty; i++) inventory.addPassive(id, qualityArg);
      return result(true, `+${qty} ${PASSIVE_DEFS[id].name} (${id}) @ ${qualityName(qualityArg)} quality.`);
    }
    if (SKILL_DEFS[id]) {
      for (let i = 0; i < qty; i++) inventory.addSkill(id, qualityArg);
      return result(true, `+${qty} ${SKILL_DEFS[id].name} (${id}) @ ${qualityName(qualityArg)} quality.`);
    }
    return result(false, `Unknown item id "${id}". Try "list item" to see valid ids.`);
  }

  return result(false, t('debug_unknown_command', { raw }));
}
