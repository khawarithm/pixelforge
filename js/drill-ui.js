// src/economy/drill-ui.js
import { getDrillDef } from './auto-drill.js';
import { t } from './i18n.js';

function el(tag, className, html) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (html !== undefined) e.innerHTML = html;
  return e;
}
function appendAll(parent, ...nodes) { for (const n of nodes) parent.appendChild(n); }

export class DrillUI {
  constructor({ modalEl, bodyEl, closeEl, backdropEl, inventory, onOpen, onClose }) {
    this.modalEl = modalEl;
    this.bodyEl = bodyEl;
    this.inventory = inventory;
    this.onOpen = onOpen;
    this.onClose = onClose;
    this.isOpen = false;

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

  _render() {
    this.bodyEl.innerHTML = '';
    appendAll(this.bodyEl, el('h2', 'forge-title', t('drill_title')));

    const drill = this.inventory.drill;
    if (!drill) {
      appendAll(this.bodyEl,
        el('p', 'forge-sub', t('drill_none_desc')),
        el('p', 'forge-empty', t('drill_none_hint')),
      );
      return;
    }

    const def = getDrillDef(drill.id);
    const card = el('div', 'drill-stat-card');
    card.innerHTML = `
      <div class="drill-stat-name">${def?.name ?? drill.id}${t('drill_active_suffix')}</div>
      <div class="drill-stat">${t('drill_stat_speed', { speed: def?.miningSpeed ?? 1 })}</div>
      <div class="drill-stat">${t('drill_stat_luck', { luck: Math.round((def?.luck ?? 0) * 100) })}</div>
      <div class="drill-stat">${t('drill_stat_offline', { rate: def?.offlineRatePerHour ?? 0 })}</div>
      <div class="drill-stat">${t('drill_stat_cap', { cap: def?.storageCapacity ?? 0 })}</div>
    `;
    appendAll(this.bodyEl,
      card,
      el('p', 'forge-sub', t('drill_active_desc')),
    );
  }
}
