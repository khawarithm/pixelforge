// src/inventory/inventory.js
import { ORES } from './ore-config.js';
import { createPassiveInstance, MAX_EQUIPPED_PASSIVES } from './passives.js';
import { createSkillInstance, trainingFragmentCostForUpgrade, MAX_EQUIPPED_SKILLS } from './skills.js';
import { enchantFragmentCost, applyEnchant } from './enchant.js';
import { ensureDailyPeriod } from './daily-quests.js';
import { ensureWeeklyPeriod } from './weekly-quests.js';

export class Inventory {
  constructor(data = {}) {
    this.gold = data.gold ?? 20;
    this.ore = { ...(data.ore ?? {}) };       // { oreId: count }
    this.equipment = data.equipment ?? [];     // instance-id'd items (Phase 2)
    this.pickaxeId = data.pickaxeId ?? 'stone';
    this.drill = data.drill ?? null;           // { id: 'basic' } | null — Phase 5 Auto Drill
    this.dungeonTickets = data.dungeonTickets ?? 0; // pre-purchased tickets from the Shop's Buy tab
    this.level = data.level ?? 1;               // Phase 6
    this.xp = data.xp ?? 0;
    this.auction = data.auction ?? null;         // { item, startingPrice, seed, listedAt, endsAt } | null
    this.deepestDungeonFloor = data.deepestDungeonFloor ?? 0; // best-ever floor count cleared in the endless dungeon
    this.discoveredOre = new Set(data.discoveredOre ?? []); // oreIds ever mined/collected — Ore Index
    // Back-compat: a save from before the Ore Index existed has ore counts
    // but no discoveredOre list — treat anything currently owned as already discovered.
    for (const oreId of Object.keys(this.ore)) {
      if ((this.ore[oreId] ?? 0) > 0) this.discoveredOre.add(oreId);
    }

    // Phase 7 — Passives (Tomes), Skills (Scrolls), Enchanting
    this.passives = data.passives ?? [];             // [{ instanceId, defId, equipped }]
    this.skills = data.skills ?? [];                 // [{ instanceId, defId, equipped, level }]
    this.enchantFragments = data.enchantFragments ?? 0;
    this.trainingFragments = data.trainingFragments ?? 0;

    // Achievements / Quests / Debug Mode unlock — see src/achievements and
    // src/quests. debugUnlocked is set true the moment the "The End of
    // All" achievement fires (Level 120 + floor 100), independent of the
    // secret debug username, and persists forever once true.
    this.unlockedAchievements = new Set(data.unlockedAchievements ?? []);
    this.claimedQuests = new Set(data.claimedQuests ?? []);
    this.debugUnlocked = data.debugUnlocked ?? false;

    // Daily / Weekly Quests — see daily-quests.js / weekly-quests.js.
    // `*Quests` holds which objectives are currently active + claimed for
    // the period; `*Stats` are period-scoped progress counters (reset to 0
    // on rollover), fed by addOre/addGold/recordKill/recordDive/
    // recordEnchant below — NOT the same as the lifetime totals the
    // one-time Quest Log (quests.js) reads.
    this.dailyQuests = data.dailyQuests ?? { periodKey: null, activeIds: [], claimed: [] };
    this.weeklyQuests = data.weeklyQuests ?? { periodKey: null, activeIds: [], claimed: [] };
    this.dailyStats = { oreMined: 0, goldEarned: 0, kills: 0, dives: 0, enchants: 0, ...(data.dailyStats ?? {}) };
    this.weeklyStats = { oreMined: 0, goldEarned: 0, kills: 0, dives: 0, enchants: 0, ...(data.weeklyStats ?? {}) };
    // Rolls over immediately on load if the save is opened after the
    // period already turned over (e.g. player skipped a day/week).
    ensureDailyPeriod(this);
    ensureWeeklyPeriod(this);

    this.listeners = new Set();
  }

  // Feeds both the Daily and Weekly counters at once, rolling either
  // period over first if the calendar has moved on since the last call.
  _recordStat(key, amount) {
    ensureDailyPeriod(this);
    ensureWeeklyPeriod(this);
    this.dailyStats[key] = (this.dailyStats[key] ?? 0) + amount;
    this.weeklyStats[key] = (this.weeklyStats[key] ?? 0) + amount;
  }

  // Called once per enemy defeated (see engine.js) — feeds the "kill N
  // enemies" Daily/Weekly quests.
  recordKill() {
    this._recordStat('kills', 1);
    this.emit();
  }

  // Called once per dungeon run that ends, win or lose (see engine.js's
  // _endDungeonRun) — feeds the "dive into the dungeon" Daily/Weekly quests.
  recordDive() {
    this._recordStat('dives', 1);
    this.emit();
  }

  onChange(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); }
  emit() { for (const fn of this.listeners) fn(this); }

  // trackStats=false is used when ore is being handed out as a Daily/Weekly
  // quest reward (see quest-rewards.js) so claiming a "mine X ore" quest
  // doesn't instantly feed its own reward back into next period's progress.
  addOre(oreId, amount = 1, trackStats = true) {
    this.ore[oreId] = (this.ore[oreId] ?? 0) + amount;
    if (amount > 0 && !this.discoveredOre.has(oreId)) this.discoveredOre.add(oreId);
    if (trackStats && amount > 0) this._recordStat('oreMined', amount);
    this.emit();
  }

  spendOre(oreId, amount) {
    if ((this.ore[oreId] ?? 0) < amount) return false;
    this.ore[oreId] -= amount;
    this.emit();
    return true;
  }

  addEquipment(item) {
    this.equipment.push(item);
    this.emit();
  }

  setEquipped(instanceId, equipped) {
    const item = this.equipment.find((e) => e.instanceId === instanceId);
    if (!item) return;
    if (equipped) {
      // one active sword + one active armor at a time
      for (const e of this.equipment) if (e.type === item.type) e.equipped = false;
    }
    item.equipped = equipped;
    this.emit();
  }

  // Used when selling to the NPC shop or listing on the auction house.
  removeEquipment(instanceId) {
    const idx = this.equipment.findIndex((e) => e.instanceId === instanceId);
    if (idx === -1) return null;
    const [item] = this.equipment.splice(idx, 1);
    this.emit();
    return item;
  }

  setDrill(drill) {
    this.drill = drill;
    this.emit();
  }

  setPickaxeId(pickaxeId) {
    this.pickaxeId = pickaxeId;
    this.emit();
  }

  addDungeonTickets(amount) {
    this.dungeonTickets = Math.max(0, this.dungeonTickets + amount);
    this.emit();
  }

  // Consumes one pre-purchased ticket; returns false if none available so
  // callers can fall back to paying the gold price at the door instead.
  spendDungeonTicket() {
    if (this.dungeonTickets <= 0) return false;
    this.dungeonTickets -= 1;
    this.emit();
    return true;
  }

  setAuction(auction) {
    this.auction = auction;
    this.emit();
  }

  // Called once a dungeon run ends. Only updates (and returns true) if this
  // run's floor count beats the previous best, so the UI can show "New Record!".
  recordDungeonFloor(floorsCleared) {
    if (floorsCleared > this.deepestDungeonFloor) {
      this.deepestDungeonFloor = floorsCleared;
      this.emit();
      return true;
    }
    return false;
  }

  // Simple curve: level N needs 50*N xp to reach N+1. Returns true if the
  // player leveled up (possibly more than once off a big xp grant), so
  // callers can show a toast.
  xpToNextLevel() {
    return 50 * this.level;
  }

  addXp(amount) {
    if (amount <= 0) return false;
    this.xp += amount;
    let leveledUp = false;
    while (this.xp >= this.xpToNextLevel()) {
      this.xp -= this.xpToNextLevel();
      this.level += 1;
      leveledUp = true;
    }
    this.emit();
    return leveledUp;
  }

  totalOreCount() {
    return Object.values(this.ore).reduce((a, b) => a + b, 0);
  }

  oreValue() {
    return Object.entries(this.ore).reduce((sum, [id, count]) => {
      const def = ORES[id];
      return sum + (def ? def.basePrice * count : 0);
    }, 0);
  }

  addGold(amount, trackStats = true) {
    if (trackStats && amount > 0) this._recordStat('goldEarned', amount);
    this.gold = Math.max(0, this.gold + amount);
    this.emit();
  }

  // ---------- Passives (Tomes) ----------

  addPassive(defId, quality = 'common') {
    const instance = createPassiveInstance(defId, quality);
    if (!instance) return null;
    this.passives.push(instance);
    this.emit();
    return instance;
  }

  // Returns false (and leaves state unchanged) if trying to equip a 3rd
  // passive — callers (main.js) surface that as a toast.
  setPassiveEquipped(instanceId, equipped) {
    const item = this.passives.find((p) => p.instanceId === instanceId);
    if (!item) return false;
    if (equipped) {
      const equippedCount = this.passives.filter((p) => p.equipped).length;
      if (equippedCount >= MAX_EQUIPPED_PASSIVES) return false;
    }
    item.equipped = equipped;
    this.emit();
    return true;
  }

  // ---------- Skills (Scrolls) ----------

  addSkill(defId, quality = 'common') {
    const instance = createSkillInstance(defId, quality);
    if (!instance) return null;
    this.skills.push(instance);
    this.emit();
    return instance;
  }

  setSkillEquipped(instanceId, equipped) {
    const item = this.skills.find((s) => s.instanceId === instanceId);
    if (!item) return false;
    if (equipped) {
      const equippedCount = this.skills.filter((s) => s.equipped).length;
      if (equippedCount >= MAX_EQUIPPED_SKILLS) return false;
    }
    item.equipped = equipped;
    this.emit();
    return true;
  }

  // Spends Training Fragments (if enough) to raise a skill instance's level
  // by 1. Returns the new level on success, or null if it couldn't afford
  // it / the skill is already maxed.
  upgradeSkill(instanceId) {
    const item = this.skills.find((s) => s.instanceId === instanceId);
    if (!item) return null;
    const cost = trainingFragmentCostForUpgrade(item);
    if (cost === null || this.trainingFragments < cost) return null;
    this.trainingFragments -= cost;
    item.level += 1;
    this.emit();
    return item.level;
  }

  addTrainingFragments(amount) {
    this.trainingFragments = Math.max(0, this.trainingFragments + amount);
    this.emit();
  }

  // ---------- Enchanting ----------

  addEnchantFragments(amount) {
    this.enchantFragments = Math.max(0, this.enchantFragments + amount);
    this.emit();
  }

  // Spends Enchant Fragments (if enough) to raise one equipped item's
  // enchant level by 1. Returns the new level on success, or null if it
  // couldn't afford it / the item is already at the enchant cap.
  enchantEquipment(instanceId) {
    const item = this.equipment.find((e) => e.instanceId === instanceId);
    if (!item) return null;
    const cost = enchantFragmentCost(item.enchantLevel ?? 0);
    if (cost === null || this.enchantFragments < cost) return null;
    this.enchantFragments -= cost;
    applyEnchant(item);
    this._recordStat('enchants', 1);
    this.emit();
    return item.enchantLevel;
  }

  serialize() {
    return {
      gold: this.gold, ore: this.ore, equipment: this.equipment, pickaxeId: this.pickaxeId,
      drill: this.drill, level: this.level, xp: this.xp, auction: this.auction,
      discoveredOre: Array.from(this.discoveredOre), dungeonTickets: this.dungeonTickets,
      deepestDungeonFloor: this.deepestDungeonFloor,
      passives: this.passives, skills: this.skills,
      enchantFragments: this.enchantFragments, trainingFragments: this.trainingFragments,
      unlockedAchievements: Array.from(this.unlockedAchievements),
      claimedQuests: Array.from(this.claimedQuests),
      debugUnlocked: this.debugUnlocked,
      dailyQuests: this.dailyQuests, weeklyQuests: this.weeklyQuests,
      dailyStats: this.dailyStats, weeklyStats: this.weeklyStats,
    };
  }
}
