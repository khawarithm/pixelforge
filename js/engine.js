// src/game/engine.js
// All entity/world rendering happens on <canvas> — DOM is reserved for the
// HUD/menus only, per the performance requirement (no per-entity DOM nodes).

import { WORLDS, TILE, TILE_COLORS } from './world.js';
import { Player, DIRECTIONS } from './player.js';
import { MiningNode, rollPickaxeVariance, rollOreDrop, getPickaxeMiningPower } from './mining.js';
import { AssetLoader } from './game-assets.js';
import { TILESET_PATH, PLAYER_SHEET_PATH, ORE_ICON_PATHS, LANDMARK_ICON_PATHS, ENEMY_ICON_PATHS, UI_ICON_PATHS } from './config-assets.js';
import { ORES } from './ore-config.js';
import { Enemy } from './enemy.js';
import { computeCombatStats, resolvePlayerHit, resolveEnemyHitOnPlayer } from './combat.js';
import { ENEMY_DEFS, DUNGEONS, rollEnemyLoot, scaleEnemyDef, dungeonEndBonus } from './dungeon.js';
import { getDrillDef, OnlineDrillTicker } from './auto-drill.js';
import { PASSIVE_DEFS } from './passives.js';
import { SKILL_DEFS, skillDuration, skillCooldown, skillValue } from './skills.js';
import { qualityName } from './quality.js';
import { SFX_PATHS, MUSIC_PATHS } from './audio-config.js';
import { t } from './i18n.js';

const AREA_NAMES = {
  village: 'Village',
  early_mine: 'Early Mine',
  deep_mine: 'Deep Mine',
  crystal_mine: 'Crystal Mine',
  molten_mine: 'Molten Mine',
  abyssal_mine: 'Abyssal Mine',
  abandoned_mine: 'Abandoned Mine',
};

// Chain of mine floors below early_mine, deepest last. Each floor's
// `entrance` landmark type sits on the *previous* floor's map (gated by
// levelReq); its `exit` type sits on its own map and leads back up one
// floor. Adding a new, deeper floor is just one more entry here (plus the
// matching map in world.js and ore defs in config/ore.js) — no branching
// logic to duplicate.
const MINE_CHAIN = [
  { id: 'deep_mine', name: 'Deep Mine', levelReq: 5, entrance: 'deep_mine_entrance', exit: 'deep_mine_exit', prev: 'early_mine', prevName: 'Early Mine' },
  { id: 'crystal_mine', name: 'Crystal Mine', levelReq: 10, entrance: 'crystal_mine_entrance', exit: 'crystal_mine_exit', prev: 'deep_mine', prevName: 'Deep Mine' },
  { id: 'molten_mine', name: 'Molten Mine', levelReq: 15, entrance: 'molten_mine_entrance', exit: 'molten_mine_exit', prev: 'crystal_mine', prevName: 'Crystal Mine' },
  { id: 'abyssal_mine', name: 'Abyssal Mine', levelReq: 20, entrance: 'abyssal_mine_entrance', exit: 'abyssal_mine_exit', prev: 'molten_mine', prevName: 'Molten Mine' },
];
const MINE_CHAIN_BY_ENTRANCE = new Map(MINE_CHAIN.map(f => [f.entrance, f]));
const MINE_CHAIN_BY_EXIT = new Map(MINE_CHAIN.map(f => [f.exit, f]));
// Hoisted out of _drawPlayer — it's the same lookup every frame, no reason
// to allocate a fresh object + four arrays 60 times a second.
const PLAYER_DIR_OFFSETS = { down: [0, 4], up: [0, -6], left: [-6, 0], right: [6, 0] };

const INTERACT_RADIUS = 42;
const MINE_RADIUS = 40;
// Sprite sizes on screen — bumped up from the raw tile/asset size so
// landmarks and ore nodes read more clearly, especially on small phone
// screens. Purely visual: interaction radii above are unaffected.
const LANDMARK_DRAW_SIZE = Math.round(TILE * 2.1); // was 1.6 — bigger, reads clearly from further away
const ORE_ICON_DRAW_SIZE = 34; // was 24
const ORE_FALLBACK_RADIUS = 12; // was 8 (procedural-circle fallback when no ore_<id>.png is present)
const PLAYER_ATTACK_RANGE = 34;
const PLAYER_ATTACK_COOLDOWN = 480; // ms, before attackSpeedMult
// Player is drawn a bit bigger than its TILE-sized sprite frame /
// collision radius (still 10px, unaffected) so it reads clearly on small
// phone screens, without being oversized.
const PLAYER_DRAW_SCALE = 1.15; // was 1.4 — slightly smaller so landmarks read as the bigger focal point

export class Engine {
  constructor({ canvas, joystick, actionBtn, hud, inventory, onSave, onDungeonEnd, playerName, audio }) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.joystick = joystick;
    this.actionBtn = actionBtn;
    this.hud = hud;
    this.inventory = inventory;
    this.onSave = onSave;
    this.onDungeonEnd = onDungeonEnd;
    this.audio = audio || null;

    this.currentWorldId = 'village';
    this.world = WORLDS.village;
    this.player = new Player({ x: this.world.spawn.x, y: this.world.spawn.y, name: playerName || 'Player' });
    this.combatStats = computeCombatStats(inventory);
    this.player.maxHp = this.combatStats.maxHp;
    this.player.hp = this.combatStats.maxHp;
    this.playerAttackTimer = 0;
    this.enemies = [];

    this.miningNodes = [];
    this.activeNode = null;
    this.miningProgress = 0;
    this.dungeonFloor = 1; // current floor of the endless Abandoned Mine dive

    // Skill runtime (Phase 7) — up to 2 equipped Skills, each tracked by
    // slot index (0/1), matching the order inventory.skills' equipped
    // entries come back in. See _equippedSkills()/activateSkill() below.
    this.skillCooldowns = [0, 0];   // ms remaining per slot
    this.skillActiveTimers = [0, 0]; // seconds remaining per slot's active effect
    this.onSkillsChanged = null;    // set by main.js — repaint skill buttons

    this.lastTime = 0;
    this.saveTimer = 0;
    this.inputLocked = false;
    this._prevActionHeld = false;

    this._resize = this._resize.bind(this);
    window.addEventListener('resize', this._resize);
    this._resize();

    this._loadMiningNodes();
    this._playAreaMusic();

    // Art is optional: missing files just leave the procedural fallback shapes in place.
    this.assets = new AssetLoader();
    this.assets.load('tileset', TILESET_PATH);
    this.assets.load('player', PLAYER_SHEET_PATH);
    this.assets.load('ui_boss_marker', UI_ICON_PATHS.bossMarker);
    for (const [oreId, path] of Object.entries(ORE_ICON_PATHS)) this.assets.load(`ore_${oreId}`, path);
    for (const [type, path] of Object.entries(LANDMARK_ICON_PATHS)) this.assets.load(`landmark_${type}`, path);
    for (const [enemyId, path] of Object.entries(ENEMY_ICON_PATHS)) this.assets.load(`enemy_${enemyId}`, path);
  }

  // ---------- Skills runtime ----------

  _equippedSkills() {
    return (this.inventory.skills ?? []).filter((s) => s.equipped).slice(0, 2);
  }

  _activeSkillBuffs() {
    const equipped = this._equippedSkills();
    let attackMult = 0, invincible = false, hasteMult = 0, damageReduction = 0;
    for (let i = 0; i < 2; i++) {
      const inst = equipped[i];
      if (!inst || this.skillActiveTimers[i] <= 0) continue;
      const def = SKILL_DEFS[inst.defId];
      if (def?.type === 'power') attackMult += skillValue(inst);
      if (def?.type === 'invincible') invincible = true;
      if (def?.type === 'haste') hasteMult += skillValue(inst);
      if (def?.type === 'shield') damageReduction = Math.max(damageReduction, skillValue(inst));
    }
    return { attackMult, invincible, hasteMult, damageReduction };
  }

  _tickSkills(dt) {
    const equipped = this._equippedSkills();
    for (let i = 0; i < 2; i++) {
      if (this.skillCooldowns[i] > 0) {
        this.skillCooldowns[i] = Math.max(0, this.skillCooldowns[i] - dt * 1000);
        if (this.skillCooldowns[i] === 0 && equipped[i]) {
          this.audio?.playSfx(SFX_PATHS.skill_ready);
        }
      }
      if (this.skillActiveTimers[i] > 0) {
        this.skillActiveTimers[i] = Math.max(0, this.skillActiveTimers[i] - dt);
        const inst = equipped[i];
        const def = inst ? SKILL_DEFS[inst.defId] : null;
        if (def?.type === 'regen') {
          const val = skillValue(inst); // fraction of maxHp healed per second
          this.player.hp = Math.min(this.player.maxHp, this.player.hp + this.player.maxHp * val * dt);
        }
      }
    }
    this.onSkillsChanged?.(this._skillButtonStates());
  }

  // Snapshot the HUD needs to draw/label the two skill buttons — icon,
  // name, cooldown ratio (0 = ready), active ratio (0 = not currently active).
  _skillButtonStates() {
    const equipped = this._equippedSkills();
    return [0, 1].map((i) => {
      const inst = equipped[i];
      if (!inst) return null;
      const def = SKILL_DEFS[inst.defId];
      const cd = skillCooldown(inst) * 1000;
      return {
        instanceId: inst.instanceId,
        icon: def.icon,
        name: def.name,
        level: inst.level,
        cooldownRatio: cd > 0 ? this.skillCooldowns[i] / cd : 0,
        active: this.skillActiveTimers[i] > 0,
        ready: this.skillCooldowns[i] <= 0,
      };
    });
  }

  // Called from main.js when a skill button is tapped.
  activateSkill(slot) {
    const equipped = this._equippedSkills();
    const inst = equipped[slot];
    if (!inst) return { ok: false };
    if (this.skillCooldowns[slot] > 0) return { ok: false, reason: 'cooldown', name: SKILL_DEFS[inst.defId]?.name };
    const def = SKILL_DEFS[inst.defId];
    this.skillActiveTimers[slot] = skillDuration(inst);
    this.skillCooldowns[slot] = skillCooldown(inst) * 1000;
    this.audio?.playSfx(SFX_PATHS.skill_activate);
    this.onSkillsChanged?.(this._skillButtonStates());
    return { ok: true, name: def.name };
  }

  _playAreaMusic() {
    if (!this.audio) return;
    if (this.currentWorldId === 'village') this.audio.playMusic('village', MUSIC_PATHS.village);
    else if (this.currentWorldId === 'abandoned_mine') this.audio.playMusic('dungeon', MUSIC_PATHS.dungeon);
    else this.audio.playMusic('mine', MUSIC_PATHS.mine);
  }

  _tickDrill(dt) {
    if (!this.inventory.drill) return;
    if (!this._drillTicker || this._drillTicker.drillId !== this.inventory.drill.id) {
      this._drillTicker = new OnlineDrillTicker(this.inventory.drill.id);
    }
    const luck = getDrillDef(this.inventory.drill.id).luck;
    const oreId = this._drillTicker.update(dt, luck);
    if (oreId) this.inventory.addOre(oreId, 1);
  }

  _resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2); // cap DPR for low-end GPUs
    const w = this.canvas.clientWidth, h = this.canvas.clientHeight;
    this.canvas.width = w * dpr;
    this.canvas.height = h * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  _loadMiningNodes() {
    this.miningNodes = (this.world.oreNodes ?? []).map(n => new MiningNode(n.oreId, n.x, n.y));
  }

  switchWorld(worldId) {
    this.currentWorldId = worldId;
    this.world = WORLDS[worldId];
    this.player.x = this.world.spawn.x;
    this.player.y = this.world.spawn.y;
    this.activeNode = null;
    this.miningProgress = 0;
    this._loadMiningNodes();
    this._loadEnemies();
    this._updateAreaLabel();
    this._playAreaMusic();
    if (worldId === 'abandoned_mine') this.audio?.playSfx(SFX_PATHS.door_enter);

    if (worldId === 'abandoned_mine' || worldId === 'village') {
      // Fresh dive / safe return: recompute stats (equipment may have
      // changed) and restore HP. Keeping the mine world out of this list
      // means taking damage would matter there too, if Phase 6 adds enemies.
      this.combatStats = computeCombatStats(this.inventory);
      this.player.maxHp = this.combatStats.maxHp;
      this.player.hp = this.combatStats.maxHp;
    }
  }

  // Abandoned Mine shows its current endless-dive floor in the HUD area
  // label; every other world just shows its plain name.
  _updateAreaLabel() {
    const base = AREA_NAMES[this.currentWorldId] ?? this.currentWorldId;
    const label = this.currentWorldId === 'abandoned_mine' ? `${base} · Floor ${this.dungeonFloor}` : base;
    this.hud.setArea(label);
  }

  _loadEnemies() {
    this.enemies = [];
    if (this.currentWorldId !== 'abandoned_mine') return;
    for (const spawn of this.world.enemySpawns ?? []) {
      const def = ENEMY_DEFS[spawn.enemyId];
      if (!def) continue;
      this.enemies.push(new Enemy(scaleEnemyDef(def, this.dungeonFloor), spawn.x * TILE + TILE / 2, spawn.y * TILE + TILE / 2));
    }
    if (this.world.bossSpawn) {
      const dungeon = DUNGEONS[this.currentWorldId];
      const bossDef = ENEMY_DEFS[dungeon?.bossId];
      if (bossDef) {
        this.enemies.push(new Enemy(scaleEnemyDef(bossDef, this.dungeonFloor), this.world.bossSpawn.x * TILE + TILE / 2, this.world.bossSpawn.y * TILE + TILE / 2));
      }
    }
  }

  // Called from main.js when the player interacts with the Dungeon Board.
  // Uses a pre-purchased ticket (bought from the Shop's Buy tab) if the
  // player has one; otherwise falls back to paying the door price in gold,
  // same as before Shop tickets existed. Every fresh dive always starts
  // back at floor 1 — the endless climb resets each time you pay to enter.
  tryEnterDungeon(dungeonId) {
    const dungeon = DUNGEONS[dungeonId];
    if (!dungeon) return { ok: false, reason: 'unknown-dungeon' };
    this.dungeonFloor = 1;
    if (this.inventory.spendDungeonTicket()) {
      this.switchWorld(dungeonId);
      return { ok: true, usedTicket: true };
    }
    if (this.inventory.gold < dungeon.ticketCost) {
      return { ok: false, reason: 'insufficient-gold', cost: dungeon.ticketCost };
    }
    this.inventory.addGold(-dungeon.ticketCost);
    this.switchWorld(dungeonId);
    return { ok: true, usedTicket: false };
  }

  // Used by the Shop's Health Potion purchase (economy/shop-ui.js) — an
  // instant full heal, safe to call whether or not the player has taken
  // any damage yet.
  healPlayerFull() {
    this.player.hp = this.player.maxHp;
  }

  // ---------- Debug Mode ----------
  // Jumps the endless Abandoned Mine dive straight to a given floor (see
  // debug/index.js's "setfloor" command). If the player is currently
  // standing inside the dungeon, enemies are respawned immediately at the
  // new floor's scaling so the change is visible without re-entering;
  // otherwise it just pre-sets the floor the next debugSetFloor call (or
  // continued dive) would use — note tryEnterDungeon() always resets to
  // floor 1 on a fresh paid entry, so this is mainly for testing floor
  // scaling while already diving.
  debugSetFloor(floor) {
    const n = Math.max(1, Math.floor(floor) || 1);
    this.dungeonFloor = n;
    if (this.currentWorldId === 'abandoned_mine') {
      this._loadEnemies();
      this._updateAreaLabel();
    }
    return n;
  }

  start() {
    // Bind once and reuse the same function reference — binding fresh every
    // frame inside _tick() would allocate a new closure 60 times a second
    // forever, for no benefit.
    this._boundTick = this._tick.bind(this);
    requestAnimationFrame(this._boundTick);
  }

  _tick(t) {
    const dt = Math.min(0.05, (t - (this.lastTime || t)) / 1000);
    this.lastTime = t;
    this.update(dt);
    this.render();
    requestAnimationFrame(this._boundTick);
  }

  update(dt) {
    if (this.inputLocked) return;
    const v = this.joystick.getVector();
    this.player.applyInput(v.x, v.y, dt);
    this._clampToWorld();

    for (const node of this.miningNodes) node.update(dt);

    // Rising-edge flag: true only on the frame the button transitions from
    // released to held. World-switch triggers use this instead of raw
    // `.held` so a single continuous hold can't fire twice in a row when a
    // world's spawn point happens to land within interact range of another
    // trigger (e.g. the mine's spawn sitting near its own exit landmark).
    const heldNow = this.actionBtn.held;
    const justPressed = heldNow && !this._prevActionHeld;
    this._prevActionHeld = heldNow;

    this._handleInteractions(dt, justPressed);
    this._tickSkills(dt);

    this.player.attackFlash = Math.max(0, this.player.attackFlash - dt);
    this.player.hurtFlash = Math.max(0, this.player.hurtFlash - dt);
    this.playerAttackTimer = Math.max(0, this.playerAttackTimer - dt * 1000);
    this.hud.setHp(this.player.hp, this.player.maxHp);
    this._tickDrill(dt);

    this.saveTimer += dt;
    if (this.saveTimer > 3) {
      this.saveTimer = 0;
      this.onSave?.();
    }
  }

  _clampToWorld() {
    const { w, h } = this.world;
    const margin = 12;
    this.player.x = Math.max(margin, Math.min(w * TILE - margin, this.player.x));
    this.player.y = Math.max(margin, Math.min(h * TILE - margin, this.player.y));
  }

  _nearestLandmark() {
    let best = null, bestDist = INTERACT_RADIUS;
    for (const lm of this.world.landmarks) {
      const lx = lm.x * TILE + TILE / 2, ly = lm.y * TILE + TILE / 2;
      const d = Math.hypot(this.player.x - lx, this.player.y - ly);
      if (d < bestDist) { best = lm; bestDist = d; }
    }
    return best;
  }

  setInputLocked(locked) {
    this.inputLocked = locked;
    if (locked) {
      this.hud.hidePrompt();
      this.hud.hideMiningProgress();
    }
  }

  // Used by main.js for tap-to-interact landmarks (blacksmith, shop, etc.)
  // that don't need the hold-based progress used by mining/mine entrances.
  getNearbyLandmarkType() {
    if (this.currentWorldId !== 'village') return null;
    const lm = this._nearestLandmark();
    return lm ? lm.type : null;
  }

  _nearestNode() {
    let best = null, bestDist = MINE_RADIUS;
    for (const node of this.miningNodes) {
      if (node.depleted) continue;
      const nx = node.tileX * TILE + TILE / 2, ny = node.tileY * TILE + TILE / 2;
      const d = Math.hypot(this.player.x - nx, this.player.y - ny);
      if (d < bestDist) { best = node; bestDist = d; }
    }
    return best;
  }

  _handleInteractions(dt, justPressed) {
    if (this.currentWorldId === 'village') {
      this.hud.setActionLabel(t('action_mine'));
      const lm = this._nearestLandmark();
      if (lm) {
        this.hud.showPrompt(this._landmarkPrompt(lm));
        if (justPressed && lm.type === 'mine_entrance') {
          this.switchWorld('early_mine');
          return;
        }
      } else {
        this.hud.hidePrompt();
      }
      this.hud.hideMiningProgress();
      this.player.action = null;
      return;
    }

    if (this.currentWorldId === 'abandoned_mine') {
      this._handleDungeonCombat(dt, justPressed);
      return;
    }

    // early_mine and every floor in MINE_CHAIN: exit/entrance landmarks + generic mining nodes
    this.hud.setActionLabel(t('action_mine'));
    const lm = this._nearestLandmark();
    if (lm && lm.type === 'mine_exit') {
      this.hud.showPrompt(t('prompt_exit_village'));
      if (justPressed) { this.switchWorld('village'); return; }
      this.hud.hideMiningProgress();
      this.player.action = null;
      return;
    }

    if (lm && MINE_CHAIN_BY_EXIT.has(lm.type)) {
      const floor = MINE_CHAIN_BY_EXIT.get(lm.type);
      this.hud.showPrompt(t('prompt_exit_floor', { name: floor.prevName }));
      if (justPressed) { this.switchWorld(floor.prev); return; }
      this.hud.hideMiningProgress();
      this.player.action = null;
      return;
    }

    if (lm && MINE_CHAIN_BY_ENTRANCE.has(lm.type)) {
      const floor = MINE_CHAIN_BY_ENTRANCE.get(lm.type);
      const meetsLevel = this.inventory.level >= floor.levelReq;
      this.hud.showPrompt(meetsLevel
        ? t('prompt_enter_floor', { name: floor.name })
        : t('prompt_level_req', { level: floor.levelReq, current: this.inventory.level }));
      if (justPressed) {
        if (meetsLevel) { this.switchWorld(floor.id); return; }
        this.hud.showToast(t('toast_level_req', { name: floor.name, level: floor.levelReq }));
      }
      this.hud.hideMiningProgress();
      this.player.action = null;
      return;
    }

    const node = this._nearestNode();
    if (!node) {
      this.hud.hidePrompt();
      this.hud.hideMiningProgress();
      this.activeNode = null;
      this.miningProgress = 0;
      this.player.action = null;
      return;
    }

    this.hud.showPrompt(t('prompt_mine_hold', { ore: node.oreId }));
    if (this.activeNode !== node) {
      this.activeNode = node;
      this.miningProgress = 0;
    }
    if (this.actionBtn.held) {
      this.player.action = 'mining';
      const pickaxe = rollPickaxeVariance(getPickaxeMiningPower(this.inventory.pickaxeId));
      this.miningProgress += pickaxe.miningSpeed * dt;
      this.hud.showMiningProgress(this.miningProgress / node.maxHp);
      if (this.miningProgress >= node.maxHp) {
        const dropped = node.applyDamage(node.maxHp);
        if (dropped) {
          const amount = rollOreDrop(dropped, pickaxe.luck);
          if (amount > 0) {
            this.inventory.addOre(dropped.id, amount);
            const leveledUp = this.inventory.addXp(2);
            this.hud.showToast(`+${amount} ${dropped.name}${leveledUp ? ` · ${t('toast_level_up', { level: this.inventory.level })}` : ''}`);
            this.audio?.playSfx(SFX_PATHS.ore_drop);
            if (leveledUp) this.audio?.playSfx(SFX_PATHS.level_up);
          } else {
            this.hud.showToast(t('toast_no_ore', { chance: Math.round(dropped.dropChance * 100) }));
          }
        }
        this.miningProgress = 0;
        this.hud.hideMiningProgress();
      }
    } else {
      this.player.action = null;
      if (this.activeNode === node) this.miningProgress = Math.max(0, this.miningProgress - dt * 1.5);
      this.hud.showMiningProgress(this.miningProgress / node.maxHp);
    }
  }

  _handleDungeonCombat(dt, justPressed) {
    this.hud.setActionLabel(t('action_attack'));

    // Cheap to recompute each frame (a couple of array finds) — keeps combat
    // stats correct if the player re-equips gear mid-dive via the inventory panel.
    this.combatStats = computeCombatStats(this.inventory, this._activeSkillBuffs());
    this.player.maxHp = this.combatStats.maxHp;
    this.player.hp = Math.min(this.player.hp, this.player.maxHp);

    const lm = this._nearestLandmark();
    if (lm && lm.type === 'dungeon_exit') {
      this.hud.showPrompt(t('prompt_retreat'));
      if (justPressed) {
        this._endDungeonRun({ retreat: true });
        return;
      }
    } else {
      this.hud.hidePrompt();
    }

    let nearestEnemy = null, nearestDist = Infinity;
    for (const enemy of this.enemies) {
      if (enemy.dead) continue;
      const result = enemy.update(dt, this.player);
      if (result?.type === 'enemyAttack') {
        const dmg = resolveEnemyHitOnPlayer(result.damage, this.combatStats.defense, this.combatStats.invincible, this.combatStats.damageReduction);
        if (dmg > 0) {
          this.player.hp = Math.max(0, this.player.hp - dmg);
          this.player.hurtFlash = 0.25;
          this.audio?.playSfx(SFX_PATHS.player_hurt);
        }
      }
      const d = Math.hypot(enemy.x - this.player.x, enemy.y - this.player.y);
      if (d < nearestDist) { nearestDist = d; nearestEnemy = enemy; }
    }

    if (this.player.hp <= 0) {
      this.enemies = [];
      this.audio?.playSfx(SFX_PATHS.defeat);
      this._endDungeonRun({ retreat: false });
      return;
    }

    if (justPressed && this.playerAttackTimer <= 0 && nearestEnemy && nearestDist <= PLAYER_ATTACK_RANGE) {
      this.player.attackFlash = 0.15;
      this.playerAttackTimer = PLAYER_ATTACK_COOLDOWN / Math.max(0.4, this.combatStats.attackSpeedMult);
      const hit = resolvePlayerHit(this.combatStats);
      nearestEnemy.takeDamage(hit.totalDamage);
      this.audio?.playSfx(SFX_PATHS.attack_swing);
      if (hit.lifesteal > 0) this.player.hp = Math.min(this.player.maxHp, this.player.hp + hit.lifesteal);

      if (nearestEnemy.dead) {
        this.inventory.recordKill();
        this.audio?.playSfx(SFX_PATHS.enemy_death);
        // Loot rolls off nearestEnemy's OWN (floor-scaled) loot table, not
        // the base ENEMY_DEFS entry — otherwise gold/ore would stop
        // growing with depth even though hp/damage do.
        const loot = rollEnemyLoot({ lootTable: nearestEnemy.lootTable }, this.combatStats.luck, this.dungeonFloor);
        this.inventory.addGold(Math.round(loot.gold * (this.combatStats.goldMult ?? 1)));
        if (loot.ore) this.inventory.addOre(loot.ore, 1);

        const toastParts = [];
        if (loot.passiveDefId) {
          this.inventory.addPassive(loot.passiveDefId, loot.passiveQuality);
          toastParts.push(t('toast_passive_found', { name: PASSIVE_DEFS[loot.passiveDefId].name, quality: qualityName(loot.passiveQuality) }));
          this.audio?.playSfx(SFX_PATHS.rare_drop);
        }
        if (loot.skillDefId) {
          this.inventory.addSkill(loot.skillDefId, loot.skillQuality);
          toastParts.push(t('toast_skill_found', { name: SKILL_DEFS[loot.skillDefId].name, quality: qualityName(loot.skillQuality) }));
          this.audio?.playSfx(SFX_PATHS.rare_drop);
        }
        if (loot.enchantFragments > 0) this.inventory.addEnchantFragments(loot.enchantFragments);
        if (loot.trainingFragments > 0) this.inventory.addTrainingFragments(loot.trainingFragments);
        const xpGain = Math.round(nearestEnemy.xp * (this.combatStats.xpMult ?? 1));
        if (this.inventory.addXp(xpGain)) {
          toastParts.push(t('toast_level_up', { level: this.inventory.level }));
          this.audio?.playSfx(SFX_PATHS.level_up);
        }
        if (toastParts.length) this.hud.showToast(toastParts.join(' · '));

        if (nearestEnemy.isBoss) {
          // Endless dungeon: beating a floor's boss doesn't end the run, it
          // opens the next floor. Only death or retreat ends it.
          this.dungeonFloor += 1;
          this.player.hp = Math.min(this.player.maxHp, this.player.hp + this.player.maxHp * 0.25);
          this.player.x = this.world.spawn.x;
          this.player.y = this.world.spawn.y;
          this._loadEnemies();
          this._updateAreaLabel();
          this.audio?.playSfx(SFX_PATHS.floor_clear);
          this.hud.showToast(t('toast_floor_cleared', { floor: this.dungeonFloor - 1, next: this.dungeonFloor }));
          return;
        }
      }
    }

    // filter() allocates a new array regardless of whether anything actually
    // died — with this running every frame in the dungeon, skip the
    // allocation entirely on the (vast majority of) frames where nothing changed.
    if (this.enemies.some((e) => e.dead)) {
      this.enemies = this.enemies.filter((e) => !e.dead);
    }
  }

  // Ends the current dungeon dive (death or retreat) — grants the flat
  // depth bonus for floors actually cleared, updates the best-floor
  // record, resets floor state, and hands the result to onDungeonEnd for
  // the result screen.
  _endDungeonRun({ retreat }) {
    const floorsCleared = this.dungeonFloor - 1;
    const bonus = dungeonEndBonus(floorsCleared);
    if (bonus.gold > 0) this.inventory.addGold(bonus.gold);
    if (bonus.xp > 0) this.inventory.addXp(bonus.xp);
    this.inventory.recordDive();
    const isNewRecord = this.inventory.recordDungeonFloor(floorsCleared);
    this.dungeonFloor = 1;
    this.switchWorld('village');
    this.onDungeonEnd?.({
      success: false,
      retreat,
      dungeonName: 'Abandoned Mine',
      floorsCleared,
      bonusGold: bonus.gold,
      bonusXp: bonus.xp,
      isNewRecord,
      deepestDungeonFloor: this.inventory.deepestDungeonFloor,
    });
  }

  _landmarkPrompt(lm) {
    switch (lm.type) {
      case 'mine_entrance': return t('prompt_mine_enter');
      case 'blacksmith': return t('prompt_blacksmith');
      case 'shop': return t('prompt_shop');
      case 'enchanter': return t('prompt_enchanter');
      case 'dungeon_npc': return this.inventory.dungeonTickets > 0
        ? t('prompt_dungeon_ticket', { count: this.inventory.dungeonTickets })
        : t('prompt_dungeon_gold', { cost: DUNGEONS.abandoned_mine.ticketCost });
      case 'auction_house': return t('prompt_auction');
      case 'storage': return t('prompt_storage');
      default: return '';
    }
  }

  render() {
    const ctx = this.ctx;
    const w = this.canvas.clientWidth, h = this.canvas.clientHeight;
    ctx.fillStyle = '#101014';
    ctx.fillRect(0, 0, w, h);

    const camX = this.player.x - w / 2;
    const camY = this.player.y - h / 2;

    this._drawTiles(camX, camY, w, h);
    if (this.world.oreNodes) this._drawOreNodes(camX, camY);
    if (this.currentWorldId === 'abandoned_mine') this._drawEnemies(camX, camY);
    this._drawLandmarks(camX, camY);
    this._drawPlayer(camX, camY);
  }

  _drawTiles(camX, camY, viewW, viewH) {
    const ctx = this.ctx;
    const { w, h, tiles } = this.world;
    const startCol = Math.max(0, Math.floor(camX / TILE));
    const endCol = Math.min(w - 1, Math.ceil((camX + viewW) / TILE));
    const startRow = Math.max(0, Math.floor(camY / TILE));
    const endRow = Math.min(h - 1, Math.ceil((camY + viewH) / TILE));
    const tileset = this.assets.get('tileset');
    const tilesetCols = tileset ? Math.floor(tileset.width / TILE) : 0;

    for (let row = startRow; row <= endRow; row++) {
      for (let col = startCol; col <= endCol; col++) {
        const t = tiles[row * w + col];
        const dx = Math.round(col * TILE - camX), dy = Math.round(row * TILE - camY);
        if (tileset && t < tilesetCols) {
          ctx.drawImage(tileset, t * TILE, 0, TILE, TILE, dx, dy, TILE + 1, TILE + 1);
        } else {
          ctx.fillStyle = TILE_COLORS[t] ?? '#000';
          ctx.fillRect(dx, dy, TILE + 1, TILE + 1);
        }
      }
    }
  }

  _drawLandmarks(camX, camY) {
    const ctx = this.ctx;
    // Drawn larger than one tile (purely visual — the interaction radius in
    // _nearestLandmark is still keyed off the tile center, so this doesn't
    // change tap targets or collision) so landmarks read more clearly on
    // small phone screens.
    const size = LANDMARK_DRAW_SIZE;
    for (const lm of this.world.landmarks) {
      const cx = lm.x * TILE - camX + TILE / 2, cy = lm.y * TILE - camY + TILE / 2;
      const x = cx - size / 2, y = cy - size / 2;
      const icon = this.assets.get(`landmark_${lm.type}`);
      if (icon) {
        ctx.drawImage(icon, x, y, size, size);
      } else {
        ctx.fillStyle = lm.color;
        ctx.fillRect(x, y, size, size);
        ctx.strokeStyle = 'rgba(0,0,0,0.4)';
        ctx.strokeRect(x + 0.5, y + 0.5, size - 1, size - 1);
      }
      ctx.fillStyle = '#fff';
      ctx.font = '9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(lm.label, cx, y - 4);
    }
  }

  _drawOreNodes(camX, camY) {
    const ctx = this.ctx;
    // Same idea as landmarks above — bigger on screen, same mining radius.
    const iconSize = ORE_ICON_DRAW_SIZE;
    const half = iconSize / 2;
    for (const node of this.miningNodes) {
      if (node.depleted) continue;
      const x = node.tileX * TILE - camX + TILE / 2, y = node.tileY * TILE - camY + TILE / 2;
      const icon = this.assets.get(`ore_${node.oreId}`);
      if (icon) {
        ctx.drawImage(icon, x - half, y - half, iconSize, iconSize);
      } else {
        ctx.fillStyle = ORES[node.oreId]?.color ?? '#fff';
        ctx.beginPath();
        ctx.arc(x, y, ORE_FALLBACK_RADIUS, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.stroke();
      }
      if (node.hp < node.maxHp) {
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(x - 14, y - half - 6, 28, 4);
        ctx.fillStyle = '#e8c23a';
        ctx.fillRect(x - 14, y - half - 6, 28 * (1 - node.hp / node.maxHp), 4);
      }
    }
  }

  _drawEnemies(camX, camY) {
    const ctx = this.ctx;
    for (const enemy of this.enemies) {
      if (enemy.dead) continue;
      const x = enemy.x - camX, y = enemy.y - camY;

      // shadow
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.beginPath();
      ctx.ellipse(x, y + enemy.size * 0.7, enemy.size * 0.8, enemy.size * 0.3, 0, 0, Math.PI * 2);
      ctx.fill();

      // Optional sprite (see config/assets.js ENEMY_ICON_PATHS) — falls back
      // to the procedural colored circle below when no file was dropped in.
      const icon = enemy.hitFlash <= 0 ? this.assets.get(`enemy_${enemy.defId}`) : null;
      if (icon) {
        const drawSize = enemy.size * 2.4;
        ctx.drawImage(icon, x - drawSize / 2, y - drawSize / 2, drawSize, drawSize);
        ctx.strokeStyle = enemy.isBoss ? '#f4d97a' : 'transparent';
        if (enemy.isBoss) {
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(x, y, enemy.size, 0, Math.PI * 2);
          ctx.stroke();
          ctx.lineWidth = 1;
        }
      } else {
        ctx.fillStyle = enemy.hitFlash > 0 ? '#ffffff' : enemy.color;
        ctx.beginPath();
        ctx.arc(x, y, enemy.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = enemy.isBoss ? '#f4d97a' : 'rgba(0,0,0,0.5)';
        ctx.lineWidth = enemy.isBoss ? 2.5 : 1;
        ctx.stroke();
        ctx.lineWidth = 1;
      }

      if (enemy.isBoss) {
        const marker = this.assets.get('ui_boss_marker');
        const markerSize = 12;
        if (marker) {
          ctx.drawImage(marker, x - markerSize / 2, y - enemy.size - 26, markerSize, markerSize);
        } else {
          // Procedural fallback crown, same spirit as every other optional
          // asset in this file — no emoji glyph, just a tiny drawn shape.
          ctx.fillStyle = '#f4d97a';
          ctx.beginPath();
          const cy = y - enemy.size - 20;
          ctx.moveTo(x - 6, cy + 4); ctx.lineTo(x - 4, cy - 4); ctx.lineTo(x - 1.5, cy + 1);
          ctx.lineTo(x, cy - 6); ctx.lineTo(x + 1.5, cy + 1); ctx.lineTo(x + 4, cy - 4);
          ctx.lineTo(x + 6, cy + 4); ctx.closePath(); ctx.fill();
        }
        ctx.fillStyle = '#f4d97a';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(enemy.name, x, y - enemy.size - 12);
      }

      // hp bar
      const barW = enemy.size * 2.4;
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(x - barW / 2, y - enemy.size - 8, barW, 4);
      ctx.fillStyle = enemy.isBoss ? '#d4304f' : '#e8c23a';
      ctx.fillRect(x - barW / 2, y - enemy.size - 8, barW * (enemy.hp / enemy.maxHp), 4);
    }
  }

  _drawPlayer(camX, camY) {
    const ctx = this.ctx;
    const p = this.player;
    const x = p.x - camX, y = p.y - camY;
    const s = PLAYER_DRAW_SCALE;
    const bob = p.moving ? (p.animFrame === 1 ? -2 * s : 0) : 0;

    // shadow
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(x, y + 10 * s, 9 * s, 4 * s, 0, 0, Math.PI * 2);
    ctx.fill();

    if (p.attackFlash > 0) {
      ctx.strokeStyle = 'rgba(244, 217, 122, 0.85)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x, y - 6 * s, 20 * s, -0.9, 0.9);
      ctx.stroke();
      ctx.lineWidth = 1;
    }

    const sheet = this.assets.get('player');
    const drawSize = TILE * s;
    if (sheet) {
      const row = DIRECTIONS.indexOf(p.dir);
      const col = p.moving ? p.animFrame : 0;
      ctx.drawImage(sheet, col * TILE, row * TILE, TILE, TILE, x - drawSize / 2, y - drawSize + 6 * s, drawSize, drawSize);
    } else {
      // procedural placeholder body — replace by dropping player.png into public/assets/sprites/
      ctx.fillStyle = p.hurtFlash > 0 ? '#e05050' : '#e0b070';
      ctx.fillRect(x - 6 * s, y - 14 * s + bob, 12 * s, 14 * s);
      ctx.fillStyle = p.action === 'mining' ? '#d4442f' : '#2f4fd4';
      ctx.fillRect(x - 7 * s, y - 2 * s + bob, 14 * s, 8 * s);
      ctx.fillStyle = '#222';
      const [dx, dy] = PLAYER_DIR_OFFSETS[p.dir];
      ctx.fillRect(x + dx * s - 1.5, y - 8 * s + dy * s + bob, 3 * s, 3 * s);
    }

    // name tag
    ctx.fillStyle = '#fff';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(p.name, x, y - 20 * s);
  }
}
