// src/dungeon/dungeon-ui.js
import { t } from './i18n.js';

function el(tag, className, html) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (html !== undefined) e.innerHTML = html;
  return e;
}
function appendAll(parent, ...nodes) { for (const n of nodes) parent.appendChild(n); }

export class DungeonResultUI {
  constructor({ modalEl, bodyEl, backdropEl }) {
    this.modalEl = modalEl;
    this.bodyEl = bodyEl;
    this.backdropEl = backdropEl;
  }

  show(result, onClose) {
    this.bodyEl.innerHTML = '';
    const floorPlural = result.floorsCleared === 1 ? '' : 's';
    const title = result.retreat ? t('dungeon_result_retreated') : t('dungeon_result_defeated');
    const sub = result.retreat
      ? t('dungeon_result_retreat_sub', { name: result.dungeonName, floors: result.floorsCleared, plural: floorPlural })
      : t('dungeon_result_defeat_sub', { nextFloor: result.floorsCleared + 1, name: result.dungeonName, floors: result.floorsCleared, plural: floorPlural });

    const parts = [
      el('h2', 'dungeon-result-title', title),
      el('p', 'forge-sub', sub),
    ];

    if (result.isNewRecord) {
      parts.push(el('p', 'forge-sub dungeon-result-record', t('dungeon_result_new_record', { floor: result.deepestDungeonFloor })));
    } else if (result.deepestDungeonFloor > 0) {
      parts.push(el('p', 'forge-sub', t('dungeon_result_best', { floor: result.deepestDungeonFloor })));
    }

    if (result.bonusGold > 0 || result.bonusXp > 0) {
      const bonusLines = [];
      if (result.bonusGold > 0) bonusLines.push(t('dungeon_result_bonus_gold', { amount: result.bonusGold }));
      if (result.bonusXp > 0) bonusLines.push(t('dungeon_result_bonus_xp', { amount: result.bonusXp }));
      parts.push(el('div', 'dungeon-loot', bonusLines.join(' \u00b7 ')));
    }

    const close = () => {
      this.modalEl.classList.add('hidden');
      onClose?.();
    };

    const btn = el('button', 'forge-start-btn', t('dungeon_result_return_btn'));
    btn.addEventListener('click', close);
    parts.push(btn);

    appendAll(this.bodyEl, ...parts);
    this.modalEl.classList.remove('hidden');

    if (this.backdropEl) this.backdropEl.onclick = close;
  }
}
