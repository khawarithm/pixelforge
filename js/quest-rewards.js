// src/quests/quest-rewards.js
// Shared reward-granting + label logic used by the one-time Quest Log
// (quests.js) as well as the Daily (daily-quests.js) and Weekly
// (weekly-quests.js) quest systems, so a reward type only ever has to be
// taught to the game once. Everything still routes through Inventory's
// normal public methods so a reward can never desync from the rest of
// the save.

import { t } from './i18n.js';
import { ORES } from './ore-config.js';
import { SKILL_DEFS } from './skills.js';
import { PASSIVE_DEFS } from './passives.js';

const ORE_IDS = Object.keys(ORES);
const SKILL_IDS = Object.keys(SKILL_DEFS);
const PASSIVE_IDS = Object.keys(PASSIVE_DEFS);

function pick(arr, rng = Math.random) {
  return arr[Math.floor(rng() * arr.length)];
}

// Grants `reward` to `inventory`. Ore/skill/tome rewards pass trackStats:
// false to addOre so claiming a "mine X ore" quest doesn't immediately
// feed its own ore reward back into next period's mining progress.
export function grantReward(reward, inventory) {
  switch (reward.type) {
    case 'gold':
      inventory.addGold(reward.amount, false);
      break;
    case 'dungeon_ticket':
      inventory.addDungeonTickets(reward.amount);
      break;
    case 'enchant_fragments':
      inventory.addEnchantFragments(reward.amount);
      break;
    case 'training_fragments':
      inventory.addTrainingFragments(reward.amount);
      break;
    case 'ore':
      inventory.addOre(reward.oreId, reward.amount, false);
      break;
    case 'random_ore':
      inventory.addOre(reward.oreId ?? pick(ORE_IDS), reward.amount, false);
      break;
    case 'skill':
      inventory.addSkill(reward.defId ?? pick(SKILL_IDS), reward.quality ?? 'fine');
      break;
    case 'tome':
      inventory.addPassive(reward.defId ?? pick(PASSIVE_IDS), reward.quality ?? 'fine');
      break;
    default:
      inventory.emit(); // state changed (claimed) even if the reward type is unrecognized
  }
}

export function rewardLabel(reward) {
  if (!reward) return '';
  switch (reward.type) {
    case 'debug_unlock':
      return t('achievements_reward_debug');
    case 'gold':
      return t('reward_gold', { amount: reward.amount });
    case 'dungeon_ticket':
      return t('reward_dungeon_ticket', { amount: reward.amount });
    case 'enchant_fragments':
      return t('reward_enchant_fragments', { amount: reward.amount });
    case 'training_fragments':
      return t('reward_training_fragments', { amount: reward.amount });
    case 'ore': {
      const name = ORES[reward.oreId]?.name ?? reward.oreId;
      return t('reward_ore', { amount: reward.amount, name });
    }
    case 'random_ore':
      return t('reward_ore_random', { amount: reward.amount });
    case 'skill':
      return t('reward_skill_random');
    case 'tome':
      return t('reward_tome_random');
    default:
      return '';
  }
}
