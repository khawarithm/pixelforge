// src/enchant/enchant-ui.js
import { enchantFragmentCost, MAX_ENCHANT_LEVEL } from './enchant.js';
import { SKILL_DEFS, trainingFragmentCostForUpgrade } from './skills.js';
import { qualityName } from './quality.js';
import { escapeHtml } from './dom-safe.js';
import { UI_ICON_PATHS } from './config-assets.js';
import { t } from './i18n.js';

function el(tag, className, html) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (html !== undefined) e.innerHTML = html;
  return e;
}
function appendAll(parent, ...nodes) { for (const n of nodes) parent.appendChild(n); }

export class EnchantUI {
  constructor({ modalEl, bodyEl, closeEl, backdropEl, inventory, onOpen, onClose, onToast, onSfx }) {
    this.modalEl = modalEl;
    this.bodyEl = bodyEl;
    this.inventory = inventory;
    this.onOpen = onOpen;
    this.onClose = onClose;
    this.onToast = onToast;
    this.onSfx = onSfx;
    this.isOpen = false;
    this.tab = 'gear'; // 'gear' | 'skills'

    closeEl.addEventListener('click', () => this.close());
    backdropEl.addEventListener('click', () => this.close());
    inventory.onChange(() => { if (this.isOpen) this._render(); });
  }

  open() {
    if (this.isOpen) return;
    this.isOpen = true;
    this.modalEl.classList.remove('hidden');
    this.onOpen?.();
    this._render();
  }

  close() {
    if (!this.isOpen) return;
    this.isOpen = false;
    this.modalEl.classList.add('hidden');
    this.onClose?.();
  }

  _setTab(tab) {
    this.tab = tab;
    this._render();
  }

  _render() {
    this.bodyEl.innerHTML = '';
    appendAll(this.bodyEl,
      el('h2', 'forge-title', t('enchant_title')),
      el('p', 'forge-sub', t('enchant_sub')),
    );

    const fragRow = el('p', 'forge-sub',
      `<img class="icon-inline" src="${UI_ICON_PATHS.scroll}" alt=""> ${t('fragments_enchant')}: ${this.inventory.enchantFragments} · ` +
      `<img class="icon-inline" src="${UI_ICON_PATHS.star}" alt=""> ${t('fragments_training')}: ${this.inventory.trainingFragments}`);
    this.bodyEl.appendChild(fragRow);

    const tabs = el('div', 'shop-tabs');
    const gearBtn = el('button', `shop-tab-btn${this.tab === 'gear' ? ' active' : ''}`, t('enchant_tab_gear'));
    const skillsBtn = el('button', `shop-tab-btn${this.tab === 'skills' ? ' active' : ''}`, t('enchant_tab_skills'));
    gearBtn.addEventListener('click', () => this._setTab('gear'));
    skillsBtn.addEventListener('click', () => this._setTab('skills'));
    appendAll(tabs, gearBtn, skillsBtn);
    this.bodyEl.appendChild(tabs);

    if (this.tab === 'gear') this._renderGear();
    else this._renderSkills();
  }

  _renderGear() {
    const sword = this.inventory.equipment.find((e) => e.equipped && e.type === 'sword');
    const armor = this.inventory.equipment.find((e) => e.equipped && e.type === 'armor');
    const list = el('div', 'shop-list');

    for (const [item, emptyKey] of [[sword, 'enchant_no_sword'], [armor, 'enchant_no_armor']]) {
      if (!item) {
        appendAll(list, el('p', 'forge-empty', t(emptyKey)));
        continue;
      }
      const level = item.enchantLevel ?? 0;
      const cost = enchantFragmentCost(level);
      const row = el('div', `shop-row rarity-${/^[a-z]+$/.test(item.rarity) ? item.rarity : 'common'}`);
      row.innerHTML = `<span class="name-col">
          <span class="name">${escapeHtml(item.name)} <span class="count">+${level}</span></span>
          <span class="ore-composition">${cost === null ? t('enchant_max_level') : `${t('enchant_cost')}: ${cost} <img class="icon-inline icon-inline--sm" src="${UI_ICON_PATHS.scroll}" alt=""> (Lv.${level}/${MAX_ENCHANT_LEVEL} <img class="icon-inline icon-inline--sm" src="${UI_ICON_PATHS.arrowRight}" alt=""> Lv.${level + 1})`}</span>
        </span>`;
      const btn = el('button', 'shop-sell-btn', cost === null ? t('enchant_max_level') : t('enchant_btn'));
      btn.disabled = cost === null || this.inventory.enchantFragments < cost;
      btn.addEventListener('click', () => {
        const newLevel = this.inventory.enchantEquipment(item.instanceId);
        if (newLevel !== null) {
          this.onSfx?.('enchant_success');
          this.onToast?.(t('enchant_success_toast', { name: item.name, level: newLevel }));
        } else {
          this.onToast?.(t('enchant_fail_toast'));
        }
      });
      row.appendChild(btn);
      list.appendChild(row);
    }
    this.bodyEl.appendChild(list);
  }

  _renderSkills() {
    const skills = this.inventory.skills ?? [];
    if (skills.length === 0) {
      appendAll(this.bodyEl, el('p', 'forge-empty', t('inv_no_skills')));
      return;
    }
    const list = el('div', 'shop-list');
    for (const instance of skills) {
      const def = SKILL_DEFS[instance.defId];
      if (!def) continue;
      const quality = instance.quality ?? 'common';
      const cost = trainingFragmentCostForUpgrade(instance);
      const row = el('div', `shop-row quality-${/^[a-z]+$/.test(quality) ? quality : 'common'}`);
      row.innerHTML = `<span class="name-col">
          <span class="name"><img class="icon-inline" src="${escapeHtml(def.icon)}" alt=""> ${escapeHtml(def.name)}${instance.equipped ? escapeHtml(t('equipped_suffix')) : ''} <span class="count">${t('skill_level')} ${instance.level}/${def.maxLevel}</span></span>
          <span class="quality-badge quality-badge--${quality}"><span class="icon-mask icon-mask--gem"></span>${escapeHtml(qualityName(quality))}</span>
          <span class="ore-composition">${cost === null ? t('skill_upgrade_max') : `${t('enchant_cost')}: ${cost} <img class="icon-inline icon-inline--sm" src="${UI_ICON_PATHS.star}" alt="">`}</span>
        </span>`;
      const btn = el('button', 'shop-sell-btn', cost === null ? t('skill_upgrade_max') : t('skill_upgrade_btn'));
      btn.disabled = cost === null || this.inventory.trainingFragments < cost;
      btn.addEventListener('click', () => {
        const newLevel = this.inventory.upgradeSkill(instance.instanceId);
        if (newLevel !== null) {
          this.onSfx?.('skill_ready');
          this.onToast?.(t('skill_upgrade_success_toast', { name: def.name, level: newLevel }));
        } else {
          this.onToast?.(t('skill_upgrade_fail_toast'));
        }
      });
      row.appendChild(btn);
      list.appendChild(row);
    }
    this.bodyEl.appendChild(list);
  }
}
