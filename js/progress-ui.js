// src/achievements/progress-ui.js
// Combined "Progress" panel — Achievements (auto-unlock, no claim needed),
// the permanent one-time Quest Log, and the period-scoped Daily/Weekly
// Quests as four tabs of one modal, reusing the same shop-tabs /
// modal-panel shell as the NPC Shop and Enchanter for visual consistency.

import { ACHIEVEMENT_DEFS } from './achievements.js';
import { QUEST_DEFS, questProgress, isQuestClaimed, claimQuest } from './quests.js';
import {
  activeDailyQuests, dailyQuestProgress, isDailyQuestClaimed, claimDailyQuest,
} from './daily-quests.js';
import {
  activeWeeklyQuests, weeklyQuestProgress, isWeeklyQuestClaimed, claimWeeklyQuest,
} from './weekly-quests.js';
import { rewardLabel } from './quest-rewards.js';
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

export class ProgressUI {
  constructor({ modalEl, bodyEl, closeEl, backdropEl, inventory, onOpen, onClose, onToast }) {
    this.modalEl = modalEl;
    this.bodyEl = bodyEl;
    this.inventory = inventory;
    this.onOpen = onOpen;
    this.onClose = onClose;
    this.onToast = onToast;
    this.isOpen = false;
    this.tab = 'achievements'; // 'achievements' | 'quests' | 'daily' | 'weekly'

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

    const tabs = el('div', 'shop-tabs');
    const achBtn = el('button', `shop-tab-btn${this.tab === 'achievements' ? ' active' : ''}`, t('progress_tab_achievements'));
    const questBtn = el('button', `shop-tab-btn${this.tab === 'quests' ? ' active' : ''}`, t('progress_tab_quests'));
    const dailyBtn = el('button', `shop-tab-btn${this.tab === 'daily' ? ' active' : ''}`, t('progress_tab_daily'));
    const weeklyBtn = el('button', `shop-tab-btn${this.tab === 'weekly' ? ' active' : ''}`, t('progress_tab_weekly'));
    achBtn.addEventListener('click', () => this._setTab('achievements'));
    questBtn.addEventListener('click', () => this._setTab('quests'));
    dailyBtn.addEventListener('click', () => this._setTab('daily'));
    weeklyBtn.addEventListener('click', () => this._setTab('weekly'));
    appendAll(tabs, achBtn, questBtn, dailyBtn, weeklyBtn);
    this.bodyEl.appendChild(tabs);

    if (this.tab === 'achievements') this._renderAchievements();
    else if (this.tab === 'quests') this._renderQuests();
    else if (this.tab === 'daily') this._renderTimedQuests({
      titleKey: 'daily_quests_title', subKey: 'daily_quests_sub',
      quests: activeDailyQuests(this.inventory),
      progressOf: (def) => dailyQuestProgress(def, this.inventory),
      isClaimed: (id) => isDailyQuestClaimed(id, this.inventory),
      claim: (id) => claimDailyQuest(id, this.inventory),
    });
    else this._renderTimedQuests({
      titleKey: 'weekly_quests_title', subKey: 'weekly_quests_sub',
      quests: activeWeeklyQuests(this.inventory),
      progressOf: (def) => weeklyQuestProgress(def, this.inventory),
      isClaimed: (id) => isWeeklyQuestClaimed(id, this.inventory),
      claim: (id) => claimWeeklyQuest(id, this.inventory),
    });
  }

  _renderAchievements() {
    const unlocked = ACHIEVEMENT_DEFS.filter((d) => this.inventory.unlockedAchievements.has(d.id)).length;
    appendAll(this.bodyEl,
      el('h2', 'forge-title', t('achievements_title')),
      el('p', 'forge-sub', t('achievements_sub')),
      el('p', 'forge-sub', t('achievements_progress', { unlocked, total: ACHIEVEMENT_DEFS.length })),
    );

    const list = el('div', 'progress-list');
    for (const def of ACHIEVEMENT_DEFS) {
      const isUnlocked = this.inventory.unlockedAchievements.has(def.id);
      const card = el('div', `progress-card${isUnlocked ? ' progress-card--unlocked' : ' progress-card--locked'}`);
      card.innerHTML = `
        <img class="progress-card-icon" src="${escapeHtml(def.icon)}" alt="">
        <div class="progress-card-body">
          <div class="progress-card-name">${escapeHtml(t(def.nameKey))}</div>
          <div class="progress-card-desc">${escapeHtml(t(def.descKey))}</div>
          ${def.reward ? `<div class="progress-card-reward">${escapeHtml(t('achievements_reward_label'))}: ${escapeHtml(rewardLabel(def.reward))}</div>` : ''}
        </div>
        <span class="progress-card-status">${isUnlocked ? escapeHtml(t('achievements_unlocked_label')) : escapeHtml(t('achievements_locked_label'))}</span>
      `;
      list.appendChild(card);
    }
    this.bodyEl.appendChild(list);
  }

  _renderQuests() {
    const done = QUEST_DEFS.filter((d) => isQuestClaimed(d.id, this.inventory)).length;
    appendAll(this.bodyEl,
      el('h2', 'forge-title', t('quests_title')),
      el('p', 'forge-sub', t('quests_sub')),
      el('p', 'forge-sub', t('quests_progress', { done, total: QUEST_DEFS.length })),
    );

    const list = el('div', 'progress-list');
    for (const def of QUEST_DEFS) {
      const claimed = isQuestClaimed(def.id, this.inventory);
      const { current, target, complete } = questProgress(def, this.inventory);
      const card = el('div', `progress-card${claimed ? ' progress-card--unlocked' : complete ? ' progress-card--ready' : ' progress-card--locked'}`);
      card.innerHTML = `
        <img class="progress-card-icon" src="${UI_ICON_PATHS.scroll}" alt="">
        <div class="progress-card-body">
          <div class="progress-card-name">${escapeHtml(t(def.nameKey))}</div>
          <div class="progress-card-desc">${escapeHtml(t(def.descKey))}</div>
          <div class="progress-bar-track"><div class="progress-bar-fill" style="width:${Math.round((current / target) * 100)}%"></div></div>
          <div class="progress-card-desc">${current} / ${target} \u00b7 ${escapeHtml(t('achievements_reward_label'))}: ${escapeHtml(rewardLabel(def.reward))}</div>
        </div>
      `;
      const statusSlot = el('span', 'progress-card-status');
      if (claimed) {
        statusSlot.textContent = t('quest_claimed');
      } else if (complete) {
        const btn = el('button', 'shop-sell-btn', t('quest_claim'));
        btn.addEventListener('click', () => {
          const claimedDef = claimQuest(def.id, this.inventory);
          if (claimedDef) this.onToast?.(t('toast_quest_claimed', { name: t(claimedDef.nameKey) }));
        });
        statusSlot.appendChild(btn);
      } else {
        statusSlot.textContent = t('quest_locked');
      }
      card.appendChild(statusSlot);
      list.appendChild(card);
    }
    this.bodyEl.appendChild(list);
  }

  // Shared renderer for the Daily and Weekly tabs — same card shape as
  // _renderQuests, just driven by whichever period's active quest list /
  // progress / claim functions get passed in (see daily-quests.js /
  // weekly-quests.js), since both periods roll over and reward the same way.
  _renderTimedQuests({ titleKey, subKey, quests, progressOf, isClaimed, claim }) {
    appendAll(this.bodyEl,
      el('h2', 'forge-title', t(titleKey)),
      el('p', 'forge-sub', t(subKey)),
    );

    const list = el('div', 'progress-list');
    for (const def of quests) {
      const claimed = isClaimed(def.id);
      const { current, target, complete } = progressOf(def);
      const card = el('div', `progress-card${claimed ? ' progress-card--unlocked' : complete ? ' progress-card--ready' : ' progress-card--locked'}`);
      card.innerHTML = `
        <img class="progress-card-icon" src="${UI_ICON_PATHS.scroll}" alt="">
        <div class="progress-card-body">
          <div class="progress-card-name">${escapeHtml(t(def.nameKey))}</div>
          <div class="progress-card-desc">${escapeHtml(t(def.descKey))}</div>
          <div class="progress-bar-track"><div class="progress-bar-fill" style="width:${Math.round((current / target) * 100)}%"></div></div>
          <div class="progress-card-desc">${current} / ${target} \u00b7 ${escapeHtml(t('achievements_reward_label'))}: ${escapeHtml(rewardLabel(def.reward))}</div>
        </div>
      `;
      const statusSlot = el('span', 'progress-card-status');
      if (claimed) {
        statusSlot.textContent = t('quest_claimed');
      } else if (complete) {
        const btn = el('button', 'shop-sell-btn', t('quest_claim'));
        btn.addEventListener('click', () => {
          const claimedDef = claim(def.id);
          if (claimedDef) this.onToast?.(t('toast_quest_claimed', { name: t(claimedDef.nameKey) }));
        });
        statusSlot.appendChild(btn);
      } else {
        statusSlot.textContent = t('quest_locked');
      }
      card.appendChild(statusSlot);
      list.appendChild(card);
    }
    this.bodyEl.appendChild(list);
  }
}
