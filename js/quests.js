// src/quests/index.js
// A structured objective list ("Quest Log") separate from Achievements:
// Achievements are permanent, auto-unlocking milestones with no upkeep;
// Quests have a concrete numeric target and a one-time reward that the
// player has to actively claim (progress-ui.js's Claim button), spending
// through Inventory's normal public methods (addGold/addDungeonTickets/
// etc) so the reward can never desync from the rest of the save.

export const QUEST_DEFS = [
  {
    id: 'gold_100',
    nameKey: 'quest_gold_100_name',
    descKey: 'quest_gold_100_desc',
    target: 100,
    progress: (inv) => inv.gold,
    reward: { type: 'gold', amount: 50 },
  },
  {
    id: 'ore_50',
    nameKey: 'quest_ore_50_name',
    descKey: 'quest_ore_50_desc',
    target: 50,
    progress: (inv) => inv.totalOreCount(),
    reward: { type: 'gold', amount: 40 },
  },
  {
    id: 'forge_1',
    nameKey: 'quest_forge_1_name',
    descKey: 'quest_forge_1_desc',
    target: 1,
    progress: (inv) => Math.min(1, inv.equipment?.length ?? 0),
    reward: { type: 'enchant_fragments', amount: 3 },
  },
  {
    id: 'level_10',
    nameKey: 'quest_level_10_name',
    descKey: 'quest_level_10_desc',
    target: 10,
    progress: (inv) => inv.level,
    reward: { type: 'gold', amount: 75 },
  },
  {
    id: 'dive_5',
    nameKey: 'quest_dive_5_name',
    descKey: 'quest_dive_5_desc',
    target: 5,
    progress: (inv) => inv.deepestDungeonFloor,
    reward: { type: 'dungeon_ticket', amount: 1 },
  },
  {
    id: 'equip_skill',
    nameKey: 'quest_equip_skill_name',
    descKey: 'quest_equip_skill_desc',
    target: 1,
    progress: (inv) => ((inv.skills ?? []).some((s) => s.equipped) ? 1 : 0),
    reward: { type: 'training_fragments', amount: 3 },
  },
  {
    id: 'equip_passive',
    nameKey: 'quest_equip_passive_name',
    descKey: 'quest_equip_passive_desc',
    target: 1,
    progress: (inv) => ((inv.passives ?? []).some((p) => p.equipped) ? 1 : 0),
    reward: { type: 'enchant_fragments', amount: 3 },
  },
  {
    id: 'dive_20',
    nameKey: 'quest_dive_20_name',
    descKey: 'quest_dive_20_desc',
    target: 20,
    progress: (inv) => inv.deepestDungeonFloor,
    reward: { type: 'gold', amount: 200 },
  },
  {
    id: 'level_50',
    nameKey: 'quest_level_50_name',
    descKey: 'quest_level_50_desc',
    target: 50,
    progress: (inv) => inv.level,
    reward: { type: 'dungeon_ticket', amount: 2 },
  },
  {
    id: 'enchant_3',
    nameKey: 'quest_enchant_3_name',
    descKey: 'quest_enchant_3_desc',
    target: 3,
    progress: (inv) => Math.max(0, ...[0, ...(inv.equipment ?? []).map((e) => e.enchantLevel ?? 0)]),
    reward: { type: 'training_fragments', amount: 5 },
  },
];

const DEFS_BY_ID = new Map(QUEST_DEFS.map((d) => [d.id, d]));

export function questProgress(def, inventory) {
  const current = Math.max(0, Math.min(def.target, def.progress(inventory)));
  return { current, target: def.target, complete: current >= def.target };
}

export function isQuestClaimed(id, inventory) {
  return inventory.claimedQuests.has(id);
}

// Grants the reward through Inventory's normal public methods (each of
// which already emits a change event on its own) and marks the quest
// claimed. Returns the def on success, or null if the quest isn't
// actually complete yet / was already claimed / doesn't exist — callers
// treat null as "nothing to do".
export function claimQuest(id, inventory) {
  const def = DEFS_BY_ID.get(id);
  if (!def) return null;
  if (inventory.claimedQuests.has(id)) return null;
  const { complete } = questProgress(def, inventory);
  if (!complete) return null;

  inventory.claimedQuests.add(id);
  switch (def.reward.type) {
    case 'gold': inventory.addGold(def.reward.amount); break;
    case 'dungeon_ticket': inventory.addDungeonTickets(def.reward.amount); break;
    case 'enchant_fragments': inventory.addEnchantFragments(def.reward.amount); break;
    case 'training_fragments': inventory.addTrainingFragments(def.reward.amount); break;
    default: inventory.emit(); // claimedQuests changed even if the reward type is unrecognized
  }
  return def;
}

export function getQuestDef(id) {
  return DEFS_BY_ID.get(id) ?? null;
}
