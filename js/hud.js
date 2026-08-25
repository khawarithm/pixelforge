// src/ui/hud.js
import { ORES } from './ore-config.js';
import { PICKAXES } from './pickaxe-config.js';
import { ORE_ICON_PATHS } from './config-assets.js';
import { escapeHtml } from './dom-safe.js';
import { formatOreComposition } from './composition.js';
import { PASSIVE_DEFS, effectivePassiveValue } from './passives.js';
import { SKILL_DEFS } from './skills.js';
import { qualityName } from './quality.js';
import { t } from './i18n.js';

// Shared onerror handler for ore sprite <img>s built via innerHTML (see
// Hud#_oreIconHtml below). Exposed on window since inline onerror="" runs in
// global scope, not module scope. Swaps a broken/missing sprite back to the
// flat-color swatch instead of leaving a broken-image icon in the list.
window.__pixelforgeOreIconError = function (imgEl) {
  const span = document.createElement('span');
  span.className = 'swatch';
  span.style.background = imgEl.dataset.color || '#888';
  imgEl.replaceWith(span);
};

export class Hud {
  constructor({ goldEl, areaEl, invToggleEl, invPanelEl, invCloseEl, invBackdropEl, invListEl, equipListEl, oreIndexListEl, passiveListEl, skillListEl, promptEl, progressWrapEl, progressBarEl, pickaxeEl, hpFillEl, hpValueEl, actionBtnEl, levelEl, xpFillEl, xpValueEl, skillBtnEls }) {
    this.goldEl = goldEl;
    this.areaEl = areaEl;
    this.invPanelEl = invPanelEl;
    this.invBackdropEl = invBackdropEl;
    this.invListEl = invListEl;
    this.equipListEl = equipListEl;
    this.oreIndexListEl = oreIndexListEl;
    this.passiveListEl = passiveListEl;
    this.skillListEl = skillListEl;
    this.promptEl = promptEl;
    this.progressWrapEl = progressWrapEl;
    this.progressBarEl = progressBarEl;
    this.pickaxeEl = pickaxeEl;
    this.hpFillEl = hpFillEl;
    this.hpValueEl = hpValueEl;
    this.actionBtnEl = actionBtnEl;
    this.levelEl = levelEl;
    this.xpFillEl = xpFillEl;
    this.xpValueEl = xpValueEl;
    this.skillBtnEls = skillBtnEls ?? []; // [btnEl, btnEl] — see updateSkillButtons()
    this._lastHp = null;
    this._lastXp = null;

    const openInv = () => {
      invPanelEl.classList.remove('hidden');
      invBackdropEl.classList.remove('hidden');
    };
    const closeInv = () => {
      invPanelEl.classList.add('hidden');
      invBackdropEl.classList.add('hidden');
    };

    invToggleEl.addEventListener('click', () => {
      invPanelEl.classList.contains('hidden') ? openInv() : closeInv();
    });
    invCloseEl.addEventListener('click', closeInv);
    invBackdropEl.addEventListener('click', closeInv);

    this.onEquipToggle = null; // set by main.js
    equipListEl.addEventListener('click', (e) => {
      const btn = e.target.closest('.equip-btn');
      if (btn && this.onEquipToggle) this.onEquipToggle(btn.dataset.instance);
    });

    this.onPassiveToggle = null; // set by main.js
    if (this.passiveListEl) {
      this.passiveListEl.addEventListener('click', (e) => {
        const btn = e.target.closest('.equip-btn');
        if (btn && this.onPassiveToggle) this.onPassiveToggle(btn.dataset.instance);
      });
    }

    this.onSkillToggle = null; // set by main.js
    if (this.skillListEl) {
      this.skillListEl.addEventListener('click', (e) => {
        const btn = e.target.closest('.equip-btn');
        if (btn && this.onSkillToggle) this.onSkillToggle(btn.dataset.instance);
      });
    }
  }

  // states: array of 2, each either null (no skill in that slot) or
  // { icon, name, level, cooldownRatio, active, ready } — see
  // game/engine.js's _skillButtonStates().
  updateSkillButtons(states = []) {
    for (let i = 0; i < this.skillBtnEls.length; i++) {
      const btnEl = this.skillBtnEls[i];
      if (!btnEl) continue;
      const state = states[i];
      if (!state) {
        btnEl.classList.add('hidden');
        continue;
      }
      btnEl.classList.remove('hidden');
      btnEl.classList.toggle('active', state.active);
      btnEl.disabled = !state.ready;
      const pct = Math.round(state.cooldownRatio * 100);
      btnEl.innerHTML = `<img class="skill-btn-icon" src="${escapeHtml(state.icon)}" alt="">` +
        (state.ready ? '' : `<span class="skill-btn-cooldown">${pct}%</span>`);
      btnEl.title = `${state.name} (Lv.${state.level})`;
    }
  }

  setArea(name) { this.areaEl.textContent = name; }
  setGold(gold) { this.goldEl.textContent = `${gold}g`; }
  setPickaxe(pickaxeId) {
    const p = PICKAXES[pickaxeId];
    this.pickaxeEl.textContent = p ? `${p.name}` : '';
  }

  setLevel(level) {
    if (this.levelEl) this.levelEl.textContent = `Lv.${level}`;
  }

  // xp/xpToNext come from Inventory (xp resets to 0 each level, xpToNextLevel = 50 * level).
  setXp(xp, xpToNext) {
    const key = `${xp}/${xpToNext}`;
    if (key === this._lastXp) return; // avoid redundant DOM writes
    this._lastXp = key;
    const ratio = xpToNext > 0 ? Math.max(0, Math.min(1, xp / xpToNext)) : 0;
    if (this.xpFillEl) this.xpFillEl.style.width = (ratio * 100) + '%';
    if (this.xpValueEl) this.xpValueEl.textContent = `${Math.round(xp)}/${Math.round(xpToNext)}`;
  }

  setHp(hp, maxHp) {
    const key = `${hp}/${maxHp}`;
    if (key === this._lastHp) return; // avoid redundant DOM writes at 60fps
    this._lastHp = key;
    const ratio = maxHp > 0 ? Math.max(0, Math.min(1, hp / maxHp)) : 0;
    this.hpFillEl.style.width = (ratio * 100) + '%';
    this.hpFillEl.classList.toggle('low', ratio <= 0.3);
    this.hpValueEl.textContent = `${Math.max(0, Math.round(hp))}/${Math.round(maxHp)}`;
  }

  setActionLabel(text) {
    if (this.actionBtnEl.textContent !== text) this.actionBtnEl.textContent = text;
  }

  showToast(message, ms = 2000) {
    const toastEl = document.getElementById('toast');
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.classList.remove('hidden');
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => toastEl.classList.add('hidden'), ms);
  }

  // Real ore art (public/assets/sprites/ore_*.png) if present, falling back
  // to the flat-color swatch used everywhere else in the UI if a sprite is
  // missing or fails to load — same "art is optional" spirit as the canvas
  // renderer.
  _oreIconHtml(def) {
    const iconPath = ORE_ICON_PATHS[def.id];
    if (!iconPath) return `<span class="swatch" style="background:${def.color}"></span>`;
    return `<img class="ore-icon" src="${escapeHtml(iconPath)}" data-color="${escapeHtml(def.color)}" alt="" onerror="window.__pixelforgeOreIconError(this)">`;
  }

  renderInventory(inventory) {
    this.invListEl.innerHTML = '';
    const entries = Object.entries(inventory.ore).filter(([, c]) => c > 0);
    if (entries.length === 0) {
      this.invListEl.innerHTML = `<li class="empty">${escapeHtml(t('inv_no_ore'))}</li>`;
    } else {
      for (const [oreId, count] of entries) {
        const def = ORES[oreId];
        if (!def) continue;
        const li = document.createElement('li');
        li.innerHTML = `${this._oreIconHtml(def)}
          <span class="name">${def.name}</span>
          <span class="count">x${count}</span>
          <span class="value">${def.basePrice * count}g</span>`;
        this.invListEl.appendChild(li);
      }
    }

    this.equipListEl.innerHTML = '';
    if (!inventory.equipment || inventory.equipment.length === 0) {
      this.equipListEl.innerHTML = `<li class="empty">${escapeHtml(t('inv_no_equipment'))}</li>`;
    } else {
      for (const item of inventory.equipment) {
        const li = document.createElement('li');
        // SECURITY: an item received via Trade or Auction is a raw snapshot
        // from another player's client — name/stats/instanceId are not
        // server-validated, so every field gets escaped before it touches
        // innerHTML. See utils/dom-safe.js.
        li.className = `equip-item rarity-${/^[a-z]+$/.test(item.rarity) ? item.rarity : 'common'}`;
        const statText = Object.entries(item.stats)
          .map(([k, v]) => `${escapeHtml(k)} +${escapeHtml(v)}`)
          .join(', ');
        const compositionLine = formatOreComposition(item);
        const enchantSuffix = item.enchantLevel > 0 ? ` <span class="count">+${item.enchantLevel}</span>` : '';
        li.innerHTML = `<span class="name">${escapeHtml(item.name)}${enchantSuffix}${item.equipped ? escapeHtml(t('equipped_suffix')) : ''}</span>
          <span class="count">${statText}</span>
          ${compositionLine ? `<span class="ore-composition">${escapeHtml(compositionLine)}</span>` : ''}
          <button class="equip-btn" data-instance="${escapeHtml(item.instanceId)}">${item.equipped ? escapeHtml(t('unequip')) : escapeHtml(t('equip'))}</button>`;
        this.equipListEl.appendChild(li);
      }
    }

    this._renderPassives(inventory);
    this._renderSkills(inventory);
    this._renderOreIndex(inventory);
  }

  // ---------- Passives (Tomes) ----------
  _renderPassives(inventory) {
    if (!this.passiveListEl) return;
    this.passiveListEl.innerHTML = '';
    const passives = inventory.passives ?? [];
    if (passives.length === 0) {
      this.passiveListEl.innerHTML = `<li class="empty">${escapeHtml(t('inv_no_passives'))}</li>`;
      return;
    }
    for (const instance of passives) {
      const def = PASSIVE_DEFS[instance.defId];
      if (!def) continue;
      const quality = instance.quality ?? 'common';
      const li = document.createElement('li');
      li.className = `equip-item quality-${/^[a-z]+$/.test(quality) ? quality : 'common'}`;
      const value = effectivePassiveValue(instance);
      const valueLabel = def.effect === 'hp' || def.effect === 'attack' || def.effect === 'defense'
        ? `+${Math.round(value)}` : `+${Math.round(value * 100)}%`;
      li.innerHTML = `<span class="name"><img class="icon-inline" src="${escapeHtml(def.icon)}" alt=""> ${escapeHtml(def.name)}${instance.equipped ? escapeHtml(t('equipped_suffix')) : ''}</span>
        <span class="quality-badge quality-badge--${quality}"><span class="icon-mask icon-mask--gem"></span>${escapeHtml(qualityName(quality))}</span>
        <span class="count">${escapeHtml(def.desc)} (${valueLabel})</span>
        <button class="equip-btn" data-instance="${escapeHtml(instance.instanceId)}">${instance.equipped ? escapeHtml(t('unequip')) : escapeHtml(t('equip'))}</button>`;
      this.passiveListEl.appendChild(li);
    }
  }

  // ---------- Skills (Scrolls) ----------
  _renderSkills(inventory) {
    if (!this.skillListEl) return;
    this.skillListEl.innerHTML = '';
    const skills = inventory.skills ?? [];
    if (skills.length === 0) {
      this.skillListEl.innerHTML = `<li class="empty">${escapeHtml(t('inv_no_skills'))}</li>`;
      return;
    }
    for (const instance of skills) {
      const def = SKILL_DEFS[instance.defId];
      if (!def) continue;
      const quality = instance.quality ?? 'common';
      const li = document.createElement('li');
      li.className = `equip-item quality-${/^[a-z]+$/.test(quality) ? quality : 'common'}`;
      li.innerHTML = `<span class="name"><img class="icon-inline" src="${escapeHtml(def.icon)}" alt=""> ${escapeHtml(def.name)}${instance.equipped ? escapeHtml(t('equipped_suffix')) : ''} <span class="count">${escapeHtml(t('skill_level'))} ${instance.level}/${def.maxLevel}</span></span>
        <span class="quality-badge quality-badge--${quality}"><span class="icon-mask icon-mask--gem"></span>${escapeHtml(qualityName(quality))}</span>
        <span class="count">${escapeHtml(def.desc)}</span>
        <button class="equip-btn" data-instance="${escapeHtml(instance.instanceId)}">${instance.equipped ? escapeHtml(t('unequip')) : escapeHtml(t('equip'))}</button>`;
      this.skillListEl.appendChild(li);
    }
  }

  // "Codex" of every ore the game knows about — discovered ones show full
  // detail, everything else stays a mystery entry. Ores from areas that
  // don't have a mine map yet (Rare Area, Ancient Area) are simply always
  // locked for now — nothing broken, just not reachable yet.
  _renderOreIndex(inventory) {
    if (!this.oreIndexListEl) return;
    this.oreIndexListEl.innerHTML = '';
    const allOreIds = Object.keys(ORES).sort((a, b) => ORES[a].basePrice - ORES[b].basePrice);
    const discoveredCount = allOreIds.filter((id) => inventory.discoveredOre?.has(id)).length;

    const summary = document.createElement('li');
    summary.className = 'ore-index-summary';
    summary.textContent = t('ore_index_discovered_count', { count: discoveredCount, total: allOreIds.length });
    this.oreIndexListEl.appendChild(summary);

    for (const oreId of allOreIds) {
      const def = ORES[oreId];
      const li = document.createElement('li');
      const discovered = inventory.discoveredOre?.has(oreId);
      if (discovered) {
        li.className = 'ore-index-entry discovered';
        li.innerHTML = `${this._oreIconHtml(def)}
          <span class="name">${def.name}</span>
          <span class="value">${def.basePrice}g base · ${Math.round(def.dropChance * 100)}% drop</span>`;
      } else {
        li.className = 'ore-index-entry locked';
        li.innerHTML = `<span class="swatch swatch--locked"></span>
          <span class="name">${escapeHtml(t('ore_index_undiscovered'))}</span>`;
      }
      this.oreIndexListEl.appendChild(li);
    }
  }

  showPrompt(text) {
    this.promptEl.textContent = text;
    this.promptEl.classList.remove('hidden');
  }
  hidePrompt() { this.promptEl.classList.add('hidden'); }

  showMiningProgress(ratio) {
    this.progressWrapEl.classList.remove('hidden');
    this.progressBarEl.style.width = `${Math.min(1, ratio) * 100}%`;
  }
  hideMiningProgress() { this.progressWrapEl.classList.add('hidden'); }
}
