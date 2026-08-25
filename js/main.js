// src/main.js
import { Engine } from './engine.js';
import { Inventory } from './inventory.js';
import { Joystick, ActionButton } from './joystick.js';
import { Hud } from './hud.js';
import { MainMenu } from './menu.js';
import { ForgeUI } from './forge-ui.js';
import { DungeonResultUI } from './dungeon-ui.js';
import { getPickaxeMiningPower } from './mining.js';
import { loadSave, writeSave } from './storage.js';
import { getCachedUsername, saveUsername, sanitizeUsername } from './player-name.js';
import { setOrientationPreference, initOrientationWatcher } from './orientation.js';
import { ShopUI } from './shop-ui.js';
import { DrillUI } from './drill-ui.js';
import { AuctionUI } from './auction-ui.js';
import { computeOfflineMining, getDrillDef } from './auto-drill.js';
import { EnchantUI } from './enchant-ui.js';
import { AudioManager } from './audio-manager.js';
import { SFX_PATHS, MUSIC_PATHS } from './audio-config.js';
import { initLanguage, getLanguage, setLanguage, onLanguageChange, applyStaticTranslations, t } from './i18n.js';
import { MAX_EQUIPPED_PASSIVES } from './passives.js';
import { MAX_EQUIPPED_SKILLS } from './skills.js';
import { isDebugUsername } from './debug.js';
import { DebugConsole } from './debug-ui.js';
import { checkAchievements } from './achievements.js';
import { ProgressUI } from './progress-ui.js';

// iOS Safari only activates the CSS :active pseudo-class on elements when a
// touch listener is registered somewhere in the ancestor chain — without
// this, the button:active pressed-feedback in style.css silently never
// fires on iPhone/iPad, and taps go back to feeling unresponsive there.
document.addEventListener('touchstart', () => {}, { passive: true });

function promptForUsername() {
  return new Promise((resolve) => {
    const modal = document.getElementById('username-modal');
    const input = document.getElementById('username-input');
    const confirmBtn = document.getElementById('username-confirm');
    const errorEl = document.getElementById('username-error');

    modal.classList.remove('hidden');
    setTimeout(() => input.focus(), 50);

    const submit = () => {
      const name = sanitizeUsername(input.value);
      if (name.length < 2) {
        errorEl.textContent = t('username_error_short');
        errorEl.classList.remove('hidden');
        return;
      }
      modal.classList.add('hidden');
      resolve(name);
    };
    confirmBtn.addEventListener('click', submit);
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') submit(); });
  });
}

function showOfflineSummary(result, elapsedSeconds) {
  const modal = document.getElementById('offline-modal');
  const body = document.getElementById('offline-body');
  const hours = Math.floor(elapsedSeconds / 3600);
  const mins = Math.floor((elapsedSeconds % 3600) / 60);
  const timeAway = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  const oreLines = Object.entries(result.ore).map(([id, count]) => `+${count}x ${id}`).join(' · ');
  const cappedNote = result.capped ? `<p class="forge-sub">${t('offline_capped_note')}</p>` : '';

  body.innerHTML = `
    <h2 class="forge-title">${t('offline_title')}</h2>
    <p class="forge-sub">${t('offline_sub', { time: timeAway })}</p>
    <div class="dungeon-loot">${oreLines || t('offline_no_ore')}</div>
    ${cappedNote}
    <button id="offline-continue" class="forge-start-btn">${t('offline_continue_btn')}</button>
  `;
  modal.classList.remove('hidden');
  document.getElementById('offline-continue').addEventListener('click', () => {
    modal.classList.add('hidden');
  });
}

async function boot() {
  initOrientationWatcher();
  initLanguage();
  applyStaticTranslations();

  const audio = new AudioManager();

  const mainMenu = new MainMenu({
    rootEl: document.getElementById('main-menu'),
    startBtn: document.getElementById('menu-start-btn'),
    howtoBtn: document.getElementById('menu-howto-btn'),
    creditsBtn: document.getElementById('menu-credits-btn'),
    howtoModal: document.getElementById('howto-modal'),
    howtoCloseBtn: document.getElementById('howto-close'),
    howtoBackdrop: document.getElementById('howto-backdrop'),
    creditsModal: document.getElementById('credits-modal'),
    creditsCloseBtn: document.getElementById('credits-close'),
    creditsBackdrop: document.getElementById('credits-backdrop'),
  });
  audio.playMusic('menu', MUSIC_PATHS.menu);
  await mainMenu.show();

  // Landscape is forced by default (see utils/orientation.js) the instant
  // the page loads via the CSS fallback in initOrientationWatcher() above —
  // that part needs no user gesture. Fullscreen + the native Screen
  // Orientation Lock API *do* need one, though, so we only attempt those
  // here, right after the player's first real tap (the Start Game button).
  setOrientationPreference('landscape');

  let username = getCachedUsername();
  if (!username) {
    username = await promptForUsername();
    saveUsername(username);
  }

  const save = loadSave();
  const inventory = new Inventory(save ?? {});
  // Debug Mode is eligible either via the secret username OR because the
  // "The End of All" achievement already unlocked it on a previous visit
  // (persisted as inventory.debugUnlocked) — see achievements/index.js.
  const debugFromUsername = isDebugUsername(username);
  let debugConsole = null;

  if (inventory.drill && save?.savedAt) {
    const elapsedSeconds = Math.max(0, (Date.now() - save.savedAt) / 1000);
    if (elapsedSeconds > 60) { // don't bother for quick reloads
      const luck = getDrillDef(inventory.drill.id).luck;
      const result = computeOfflineMining(inventory.drill, elapsedSeconds, luck);
      if (result.total > 0) {
        for (const [oreId, count] of Object.entries(result.ore)) inventory.addOre(oreId, count);
        showOfflineSummary(result, elapsedSeconds);
      }
    }
  }

  const hud = new Hud({
    goldEl: document.getElementById('gold-value'),
    areaEl: document.getElementById('area-name'),
    invToggleEl: document.getElementById('inv-toggle'),
    invPanelEl: document.getElementById('inv-panel'),
    invCloseEl: document.getElementById('inv-close'),
    invBackdropEl: document.getElementById('inv-backdrop'),
    invListEl: document.getElementById('inv-list'),
    equipListEl: document.getElementById('equip-list'),
    oreIndexListEl: document.getElementById('ore-index-list'),
    passiveListEl: document.getElementById('passive-list'),
    skillListEl: document.getElementById('skill-list'),
    promptEl: document.getElementById('interact-prompt'),
    progressWrapEl: document.getElementById('mine-progress-wrap'),
    progressBarEl: document.getElementById('mine-progress-bar'),
    pickaxeEl: document.getElementById('pickaxe-name'),
    hpFillEl: document.getElementById('hp-bar-fill'),
    hpValueEl: document.getElementById('hp-value'),
    actionBtnEl: document.getElementById('action-btn'),
    levelEl: document.getElementById('level-value'),
    xpFillEl: document.getElementById('xp-bar-fill'),
    xpValueEl: document.getElementById('xp-value'),
    skillBtnEls: [document.getElementById('skill-btn-1'), document.getElementById('skill-btn-2')],
  });

  const joystick = new Joystick(document.getElementById('joystick-base'), document.getElementById('joystick-knob'));
  const actionBtn = new ActionButton(document.getElementById('action-btn'));

  const dungeonResultUI = new DungeonResultUI({
    modalEl: document.getElementById('dungeon-modal'),
    bodyEl: document.getElementById('dungeon-body'),
    backdropEl: document.getElementById('dungeon-backdrop'),
  });

  const engine = new Engine({
    canvas: document.getElementById('game-canvas'),
    joystick,
    actionBtn,
    hud,
    inventory,
    onSave: () => writeSave(inventory.serialize()),
    onDungeonEnd: (result) => dungeonResultUI.show(result, () => {}),
    playerName: username,
    audio,
  });

  engine.onSkillsChanged = (states) => hud.updateSkillButtons(states);

  // ---------- Debug Mode console ----------
  // Created once, the first time it becomes eligible (secret username at
  // boot, or the moment the "End of All" achievement fires below). The
  // floating DEBUG tab it reveals stays up for the rest of the session.
  function enableDebugConsole() {
    if (debugConsole) return;
    debugConsole = new DebugConsole({
      tabEl: document.getElementById('debug-tab'),
      modalEl: document.getElementById('debug-modal'),
      backdropEl: document.getElementById('debug-backdrop'),
      logEl: document.getElementById('debug-log'),
      inputEl: document.getElementById('debug-input'),
      runBtnEl: document.getElementById('debug-run'),
      closeBtnEl: document.getElementById('debug-close'),
      inventory,
      engine,
    });
  }
  if (debugFromUsername || inventory.debugUnlocked) {
    enableDebugConsole();
    if (debugFromUsername) debugConsole.toggle(); // open immediately — no need to hunt for the tab
  }

  inventory.onChange((inv) => {
    // Achievements are checked on every inventory change (cheap — a dozen
    // condition checks) and mutate `inv` directly (gold/debugUnlocked/
    // unlockedAchievements) rather than emitting their own change event,
    // so the hud.* calls right below already reflect any reward applied
    // this pass — see achievements/index.js's checkAchievements() doc.
    const newlyUnlocked = checkAchievements(inv);
    for (const def of newlyUnlocked) {
      hud.showToast(t('toast_achievement_unlocked', { name: t(def.nameKey) }));
      if (def.reward?.type === 'debug_unlock') {
        enableDebugConsole();
        // Staggered so it doesn't instantly overwrite the achievement toast
        // above — hud.showToast only has room for one message at a time.
        setTimeout(() => hud.showToast(t('toast_debug_unlocked')), 2200);
      }
    }

    hud.setGold(inv.gold);
    hud.renderInventory(inv);
    hud.setLevel(inv.level);
    hud.setXp(inv.xp, inv.xpToNextLevel());
    hud.setPickaxe(inv.pickaxeId);
  });
  hud.onEquipToggle = (instanceId) => {
    const item = inventory.equipment.find((e) => e.instanceId === instanceId);
    if (item) inventory.setEquipped(instanceId, !item.equipped);
  };
  hud.onPassiveToggle = (instanceId) => {
    const item = inventory.passives.find((p) => p.instanceId === instanceId);
    if (!item) return;
    const ok = inventory.setPassiveEquipped(instanceId, !item.equipped);
    if (!ok && !item.equipped) hud.showToast(t('toast_max_passives', { max: MAX_EQUIPPED_PASSIVES }));
  };
  hud.onSkillToggle = (instanceId) => {
    const item = inventory.skills.find((s) => s.instanceId === instanceId);
    if (!item) return;
    const ok = inventory.setSkillEquipped(instanceId, !item.equipped);
    if (!ok && !item.equipped) hud.showToast(t('toast_max_skills', { max: MAX_EQUIPPED_SKILLS }));
  };
  hud.setGold(inventory.gold);
  hud.renderInventory(inventory);
  hud.setPickaxe(inventory.pickaxeId);
  hud.setLevel(inventory.level);
  hud.setXp(inventory.xp, inventory.xpToNextLevel());
  hud.setArea('Village');

  const forgeUI = new ForgeUI({
    modalEl: document.getElementById('forge-modal'),
    bodyEl: document.getElementById('forge-body'),
    closeEl: document.getElementById('forge-close'),
    backdropEl: document.getElementById('forge-backdrop'),
    inventory,
    getLuck: () => getPickaxeMiningPower(inventory.pickaxeId).luck,
    onOpen: () => engine.setInputLocked(true),
    onClose: () => engine.setInputLocked(false),
    onViewInventory: () => {
      const invPanel = document.getElementById('inv-panel');
      const invBackdrop = document.getElementById('inv-backdrop');
      invPanel.classList.remove('hidden');
      invBackdrop.classList.remove('hidden');
      document.getElementById('equip-list').scrollIntoView({ behavior: 'smooth', block: 'start' });
    },
    onToast: (msg) => hud.showToast(msg),
  });

  const shopUI = new ShopUI({
    modalEl: document.getElementById('shop-modal'),
    bodyEl: document.getElementById('shop-body'),
    closeEl: document.getElementById('shop-close'),
    backdropEl: document.getElementById('shop-backdrop'),
    inventory,
    onHealPlayer: () => engine.healPlayerFull(),
    onOpen: () => engine.setInputLocked(true),
    onClose: () => engine.setInputLocked(false),
  });

  const drillUI = new DrillUI({
    modalEl: document.getElementById('drill-modal'),
    bodyEl: document.getElementById('drill-body'),
    closeEl: document.getElementById('drill-close'),
    backdropEl: document.getElementById('drill-backdrop'),
    inventory,
    onOpen: () => engine.setInputLocked(true),
    onClose: () => engine.setInputLocked(false),
  });

  const auctionUI = new AuctionUI({
    modalEl: document.getElementById('auction-modal'),
    bodyEl: document.getElementById('auction-body'),
    closeEl: document.getElementById('auction-close'),
    backdropEl: document.getElementById('auction-backdrop'),
    inventory,
    onOpen: () => engine.setInputLocked(true),
    onClose: () => engine.setInputLocked(false),
    onToast: (msg) => hud.showToast(msg),
  });

  const enchantUI = new EnchantUI({
    modalEl: document.getElementById('enchant-modal'),
    bodyEl: document.getElementById('enchant-body'),
    closeEl: document.getElementById('enchant-close'),
    backdropEl: document.getElementById('enchant-backdrop'),
    inventory,
    onOpen: () => engine.setInputLocked(true),
    onClose: () => engine.setInputLocked(false),
    onToast: (msg) => hud.showToast(msg),
    onSfx: (key) => audio.playSfx(SFX_PATHS[key]),
  });

  const progressUI = new ProgressUI({
    modalEl: document.getElementById('progress-modal'),
    bodyEl: document.getElementById('progress-body'),
    closeEl: document.getElementById('progress-close'),
    backdropEl: document.getElementById('progress-backdrop'),
    inventory,
    onOpen: () => engine.setInputLocked(true),
    onClose: () => engine.setInputLocked(false),
    onToast: (msg) => hud.showToast(msg),
  });
  document.getElementById('progress-toggle').addEventListener('click', () => progressUI.open());

  actionBtn.onTap(() => {
    const settingsOpen = !document.getElementById('settings-modal').classList.contains('hidden');
    if (forgeUI.isOpen || shopUI.isOpen || drillUI.isOpen || auctionUI.isOpen || enchantUI.isOpen || progressUI.isOpen || settingsOpen) return;
    const type = engine.getNearbyLandmarkType();
    if (type === 'blacksmith') { forgeUI.open(); return; }
    if (type === 'shop') { shopUI.open(); return; }
    if (type === 'storage') { drillUI.open(); return; }
    if (type === 'auction_house') { auctionUI.open(); return; }
    if (type === 'enchanter') { enchantUI.open(); return; }
    if (type === 'dungeon_npc') {
      const result = engine.tryEnterDungeon('abandoned_mine');
      if (!result.ok && result.reason === 'insufficient-gold') {
        hud.showToast(t('toast_need_gold', { cost: result.cost }));
      } else if (result.ok && result.usedTicket) {
        hud.showToast(t('toast_used_ticket'));
      }
    }
  });

  // Skill activation buttons (appear next to the action button once a Skill
  // is equipped — see game/engine.js's skill runtime + Hud.updateSkillButtons).
  [0, 1].forEach((slot) => {
    const btn = document.getElementById(`skill-btn-${slot + 1}`);
    btn.addEventListener('click', () => {
      const result = engine.activateSkill(slot);
      if (result.ok) audio.playSfx(SFX_PATHS.skill_activate);
      else if (result.reason === 'cooldown') hud.showToast(t('toast_skill_cooldown', { name: result.name }));
    });
  });

  window.addEventListener('beforeunload', () => {
    writeSave(inventory.serialize());
  });

  setupSettingsUI(engine, audio, inventory, hud, { shopUI, drillUI, auctionUI, enchantUI, progressUI });

  engine.start();
}

function setupSettingsUI(engine, audio, inventory, hud, uis) {
  const { shopUI, drillUI, auctionUI, enchantUI, progressUI } = uis;
  const modal = document.getElementById('settings-modal');
  const backdrop = document.getElementById('settings-backdrop');
  const closeBtn = document.getElementById('settings-close');

  const open = () => {
    modal.classList.remove('hidden');
    engine.setInputLocked(true);
  };
  const close = () => {
    modal.classList.add('hidden');
    engine.setInputLocked(false);
  };

  document.getElementById('settings-toggle').addEventListener('click', open);
  closeBtn.addEventListener('click', close);
  backdrop.addEventListener('click', close);

  // ---------- Audio volume sliders ----------
  const masterSlider = document.getElementById('volume-master');
  const musicSlider = document.getElementById('volume-music');
  const sfxSlider = document.getElementById('volume-sfx');
  masterSlider.value = Math.round(audio.master * 100);
  musicSlider.value = Math.round(audio.music * 100);
  sfxSlider.value = Math.round(audio.sfx * 100);
  masterSlider.addEventListener('input', () => audio.setMaster(masterSlider.value / 100));
  musicSlider.addEventListener('input', () => audio.setMusic(musicSlider.value / 100));
  sfxSlider.addEventListener('input', () => audio.setSfx(sfxSlider.value / 100));

  // ---------- Language ----------
  const langRow = document.getElementById('language-row');
  const langButtons = langRow.querySelectorAll('.forge-type-btn');
  const highlightLang = (lang) => {
    langButtons.forEach((b) => b.classList.toggle('selected', b.dataset.lang === lang));
  };
  highlightLang(getLanguage());
  langButtons.forEach((btn) => {
    btn.addEventListener('click', () => setLanguage(btn.dataset.lang));
  });
  onLanguageChange((lang) => {
    highlightLang(lang);
    applyStaticTranslations();
    hud.renderInventory(inventory); // re-render dynamic labels (Equip/Unequip, empty states, etc.)
    // Re-render any of the simpler modals if they're open right now, so a
    // language switch mid-session doesn't leave stale text behind until
    // the player closes and reopens. ForgeUI is deliberately skipped here:
    // it's a multi-stage mini-game with live timers, and force-re-entering
    // its render pipeline mid-round would risk resetting an in-progress
    // attempt — safer to just let it pick up the new language next time
    // it's opened.
    for (const ui of [shopUI, drillUI, auctionUI, enchantUI, progressUI]) {
      if (ui.isOpen) ui._render?.();
    }
  });
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js').catch(() => {});
  });
}

document.addEventListener('DOMContentLoaded', boot);
