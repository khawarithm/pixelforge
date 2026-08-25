// src/achievements/index.js
// Structured milestones, checked automatically every time the Inventory
// changes (see main.js's inventory.onChange). Achievements only ever ADD
// state — inventory.unlockedAchievements is a Set that only grows — and,
// for reward-bearing ones, mutate a couple of plain Inventory fields
// directly rather than going through addGold()/etc, so checking them from
// inside an onChange listener can never recurse into itself. There is no
// separate "achievement state" that can fall out of sync with a save file:
// it's just one more Set serialized alongside everything else.
//
// "The End of All" / "Akhir dari Segalanya" is the game's single debug
// mode unlock condition — see debug/index.js for what that unlocks.

import { ORES } from './ore-config.js';

const ICON_BASE = './assets/icons/ui/';

export const ACHIEVEMENT_DEFS = [
  {
    id: 'first_ore',
    icon: ICON_BASE + 'sparkles.svg',
    nameKey: 'ach_first_ore_name',
    descKey: 'ach_first_ore_desc',
    condition: (inv) => (inv.discoveredOre?.size ?? 0) >= 1,
  },
  {
    id: 'armed_and_ready',
    icon: ICON_BASE + 'sword.svg',
    nameKey: 'ach_armed_name',
    descKey: 'ach_armed_desc',
    condition: (inv) => (inv.equipment?.length ?? 0) >= 1,
  },
  {
    id: 'level_5',
    icon: ICON_BASE + 'star.svg',
    nameKey: 'ach_level_5_name',
    descKey: 'ach_level_5_desc',
    condition: (inv) => inv.level >= 5,
  },
  {
    id: 'level_25',
    icon: ICON_BASE + 'star.svg',
    nameKey: 'ach_level_25_name',
    descKey: 'ach_level_25_desc',
    condition: (inv) => inv.level >= 25,
  },
  {
    id: 'level_50',
    icon: ICON_BASE + 'star.svg',
    nameKey: 'ach_level_50_name',
    descKey: 'ach_level_50_desc',
    condition: (inv) => inv.level >= 50,
  },
  {
    id: 'level_80',
    icon: ICON_BASE + 'star.svg',
    nameKey: 'ach_level_80_name',
    descKey: 'ach_level_80_desc',
    condition: (inv) => inv.level >= 80,
  },
  {
    id: 'dive_10',
    icon: ICON_BASE + 'boss_marker.svg',
    nameKey: 'ach_dive_10_name',
    descKey: 'ach_dive_10_desc',
    condition: (inv) => inv.deepestDungeonFloor >= 10,
  },
  {
    id: 'dive_50',
    icon: ICON_BASE + 'boss_marker.svg',
    nameKey: 'ach_dive_50_name',
    descKey: 'ach_dive_50_desc',
    condition: (inv) => inv.deepestDungeonFloor >= 50,
  },
  {
    id: 'ore_collector',
    icon: ICON_BASE + 'quality_gem.svg',
    nameKey: 'ach_ore_collector_name',
    descKey: 'ach_ore_collector_desc',
    condition: (inv) => (inv.discoveredOre?.size ?? 0) >= 15,
  },
  {
    id: 'enchant_apprentice',
    icon: ICON_BASE + 'scroll.svg',
    nameKey: 'ach_enchant_apprentice_name',
    descKey: 'ach_enchant_apprentice_desc',
    condition: (inv) => (inv.equipment ?? []).some((e) => (e.enchantLevel ?? 0) >= 1),
  },
  {
    id: 'enchant_empowered',
    icon: ICON_BASE + 'scroll.svg',
    nameKey: 'ach_enchant_empowered_name',
    descKey: 'ach_enchant_empowered_desc',
    condition: (inv) => (inv.equipment ?? []).some((e) => (e.enchantLevel ?? 0) >= 5),
  },
  {
    id: 'skilled_adventurer',
    icon: ICON_BASE + 'shield.svg',
    nameKey: 'ach_skilled_name',
    descKey: 'ach_skilled_desc',
    condition: (inv) => (inv.skills ?? []).some((s) => s.equipped),
  },
  {
    id: 'the_end_of_all',
    icon: ICON_BASE + 'trophy.svg',
    nameKey: 'ach_end_name',
    descKey: 'ach_end_desc',
    condition: (inv) => inv.level >= 120 && inv.deepestDungeonFloor >= 100,
    reward: { type: 'debug_unlock' },
  },
];

const DEFS_BY_ID = new Map(ACHIEVEMENT_DEFS.map((d) => [d.id, d]));

function applyReward(def, inventory) {
  if (!def.reward) return;
  if (def.reward.type === 'debug_unlock') inventory.debugUnlocked = true;
}

// Checks every not-yet-unlocked achievement against the current inventory
// state. Mutates inventory.unlockedAchievements (and applies any reward)
// in place, and returns the list of defs that were newly unlocked this
// call — main.js uses that to show toasts / reveal the Debug tab. Does
// NOT call inventory.emit() itself: this is designed to be called from
// inside an existing onChange listener, right before the rest of that
// listener reads inventory fields (gold, debugUnlocked, ...) to refresh
// the UI — so the freshly-applied reward is picked up for free without
// re-triggering listeners.
export function checkAchievements(inventory) {
  const newlyUnlocked = [];
  for (const def of ACHIEVEMENT_DEFS) {
    if (inventory.unlockedAchievements.has(def.id)) continue;
    if (def.condition(inventory)) {
      inventory.unlockedAchievements.add(def.id);
      applyReward(def, inventory);
      newlyUnlocked.push(def);
    }
  }
  return newlyUnlocked;
}

// Debug Mode's "unlock achievement (id)" command reuses this so a forced
// unlock goes through the exact same reward path as an organic one.
export function forceUnlockAchievement(id, inventory) {
  const def = DEFS_BY_ID.get(id);
  if (!def) return null;
  if (!inventory.unlockedAchievements.has(id)) {
    inventory.unlockedAchievements.add(id);
    applyReward(def, inventory);
  }
  return def;
}

export function getAchievementDef(id) {
  return DEFS_BY_ID.get(id) ?? null;
}

// Referenced by ore_collector's description context (kept here so the
// achievements module owns its one piece of derived data instead of
// hud.js/progress-ui.js reaching into config/ore.js just for a count).
export function totalKnownOreCount() {
  return Object.keys(ORES).length;
}
