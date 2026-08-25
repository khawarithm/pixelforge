// src/forging/forge-ui.js
import { ORES } from './ore-config.js';
import { PICKAXES } from './pickaxe-config.js';
import { rollForgeResult, MIN_ORE_PER_FORGE, MAX_ORE_PER_FORGE } from './forging.js';
import { formatOreComposition } from './composition.js';
import { UI_ICON_PATHS } from './config-assets.js';
import { t } from './i18n.js';

const ARROW_ICONS = { up: UI_ICON_PATHS.arrowUp, down: UI_ICON_PATHS.arrowDown, left: UI_ICON_PATHS.arrowLeft, right: UI_ICON_PATHS.arrowRight };

function el(tag, className, html) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (html !== undefined) e.innerHTML = html;
  return e;
}

function wait(ms) { return new Promise((r) => setTimeout(r, ms)); }

// appendChild-based multi-append — safer than Element.append() on older/
// low-end Android WebViews that may not support the newer multi-arg API.
function appendAll(parent, ...nodes) {
  for (const n of nodes) parent.appendChild(n);
}

export class ForgeUI {
  constructor({ modalEl, bodyEl, closeEl, backdropEl, inventory, getLuck, onOpen, onClose, onViewInventory, onToast }) {
    this.modalEl = modalEl;
    this.bodyEl = bodyEl;
    this.inventory = inventory;
    this.getLuck = getLuck ?? (() => 0);
    this.onOpen = onOpen;
    this.onClose = onClose;
    this.onViewInventory = onViewInventory;
    this.onToast = onToast;
    this.isOpen = false;
    // True from the moment ore is spent to start a forge until the result
    // (or a failure) is settled. Guards accidental taps from silently
    // eating the player's materials.
    this._forgeActive = false;
    this._activeComposition = null;
    this._confirmEl = null;

    closeEl.addEventListener('click', () => this._requestClose());
    backdropEl.addEventListener('click', () => this._requestClose());
  }

  open() {
    if (this.isOpen) return;
    this.isOpen = true;
    this.modalEl.classList.remove('hidden');
    this.onOpen?.();
    this._renderSelect();
  }

  // Entry point for the close button / backdrop tap. While a forge is in
  // progress this asks for confirmation instead of closing immediately —
  // an accidental tap used to close the modal outright and silently
  // consume the ore that had already been spent.
  _requestClose() {
    if (!this.isOpen) return;
    if (!this._forgeActive) {
      this.close();
      return;
    }
    this._showCloseConfirm();
  }

  _showCloseConfirm() {
    if (this._confirmEl) return;
    const panel = this.bodyEl.parentElement || this.modalEl;
    const overlay = el('div', 'forge-close-confirm');
    overlay.style.cssText = [
      'position:absolute', 'inset:0', 'z-index:5', 'border-radius:12px',
      'display:flex', 'flex-direction:column', 'align-items:center',
      'justify-content:center', 'gap:14px', 'padding:24px', 'text-align:center',
      'background:rgba(10,8,6,0.94)',
    ].join(';');
    const title = el('h2', 'forge-title', t('forge_close_confirm_title'));
    const sub = el('p', 'forge-sub', t('forge_close_confirm_sub'));
    const stayBtn = el('button', 'forge-start-btn', t('forge_keep_forging_btn'));
    const leaveBtn = el('button', 'forge-type-btn', t('forge_leave_btn'));
    stayBtn.addEventListener('click', () => this._hideCloseConfirm());
    leaveBtn.addEventListener('click', () => {
      this._hideCloseConfirm();
      this._cancelForge();
    });
    appendAll(overlay, title, sub, stayBtn, leaveBtn);
    panel.appendChild(overlay);
    this._confirmEl = overlay;
  }

  _hideCloseConfirm() {
    if (this._confirmEl) {
      this._confirmEl.remove();
      this._confirmEl = null;
    }
  }

  // Refunds whatever ore is currently committed to an in-progress forge,
  // then closes for real.
  _cancelForge() {
    if (this._activeComposition) {
      for (const c of this._activeComposition) this.inventory.addOre(c.ore.id, c.count);
      this.onToast?.(t('forge_toast_left'));
    }
    this._forgeActive = false;
    this._activeComposition = null;
    this.close();
  }

  close() {
    if (!this.isOpen) return;
    this.isOpen = false;
    this.modalEl.classList.add('hidden');
    this.bodyEl.innerHTML = '';
    this._hideCloseConfirm();
    this.onClose?.();
  }

  // ---------- Screen 1: choose ore mix + equipment type ----------
  _renderSelect() {
    this.bodyEl.innerHTML = '';
    const title = el('h2', 'forge-title', t('forge_title'));
    const sub = el('p', 'forge-sub', t('forge_sub', { min: MIN_ORE_PER_FORGE, max: MAX_ORE_PER_FORGE }));
    appendAll(this.bodyEl, title, sub);

    const available = Object.entries(this.inventory.ore).filter(([, c]) => c > 0);
    if (available.length === 0) {
      appendAll(this.bodyEl, el('p', 'forge-empty', t('forge_no_ore')));
      return;
    }

    const selection = new Map(); // oreId -> count
    let selectedType = 'sword';

    const totalEl = el('p', 'forge-sub', '');
    const updateTotal = () => {
      const total = [...selection.values()].reduce((a, b) => a + b, 0);
      totalEl.textContent = t('forge_selected', { total, max: MAX_ORE_PER_FORGE, min: MIN_ORE_PER_FORGE });
      startBtn.disabled = total < MIN_ORE_PER_FORGE || total > MAX_ORE_PER_FORGE;
    };

    const oreGrid = el('div', 'forge-ore-grid forge-ore-grid--stepper');
    for (const [oreId, ownedCount] of available) {
      const def = ORES[oreId];
      const row = el('div', 'forge-ore-card forge-ore-card--stepper');
      row.innerHTML = `<span class="swatch" style="background:${def.color}"></span>
        <span class="name">${def.name}<span class="count">${t('forge_owned', { count: ownedCount })}</span></span>`;

      const stepper = el('div', 'ore-stepper');
      const minusBtn = el('button', 'ore-step-btn', '−');
      const valueEl = el('span', 'ore-step-value', '0');
      const plusBtn = el('button', 'ore-step-btn', '+');
      minusBtn.addEventListener('click', () => {
        const cur = selection.get(oreId) ?? 0;
        if (cur <= 0) return;
        const next = cur - 1;
        if (next === 0) selection.delete(oreId); else selection.set(oreId, next);
        valueEl.textContent = String(next);
        updateTotal();
      });
      plusBtn.addEventListener('click', () => {
        const cur = selection.get(oreId) ?? 0;
        const total = [...selection.values()].reduce((a, b) => a + b, 0);
        if (cur >= ownedCount || total >= MAX_ORE_PER_FORGE) return;
        const next = cur + 1;
        selection.set(oreId, next);
        valueEl.textContent = String(next);
        updateTotal();
      });
      appendAll(stepper, minusBtn, valueEl, plusBtn);
      row.appendChild(stepper);
      oreGrid.appendChild(row);
    }
    this.bodyEl.appendChild(oreGrid);
    this.bodyEl.appendChild(totalEl);

    const typeRow = el('div', 'forge-type-row');
    const swordBtn = el('button', 'forge-type-btn selected', `<img class="icon-inline" src="${UI_ICON_PATHS.sword}" alt=""> ${t('forge_type_sword')}`);
    const armorBtn = el('button', 'forge-type-btn', `<img class="icon-inline" src="${UI_ICON_PATHS.shield}" alt=""> ${t('forge_type_armor')}`);
    swordBtn.addEventListener('click', () => { selectedType = 'sword'; swordBtn.classList.add('selected'); armorBtn.classList.remove('selected'); });
    armorBtn.addEventListener('click', () => { selectedType = 'armor'; armorBtn.classList.add('selected'); swordBtn.classList.remove('selected'); });
    appendAll(typeRow, swordBtn, armorBtn);
    this.bodyEl.appendChild(typeRow);

    const startBtn = el('button', 'forge-start-btn', t('forge_start_btn'));
    startBtn.disabled = true;
    startBtn.addEventListener('click', () => {
      const total = [...selection.values()].reduce((a, b) => a + b, 0);
      if (total < MIN_ORE_PER_FORGE || total > MAX_ORE_PER_FORGE) return;

      const spent = [];
      for (const [oreId, count] of selection.entries()) {
        if (!this.inventory.spendOre(oreId, count)) {
          for (const [refundId, refundCount] of spent) this.inventory.addOre(refundId, refundCount);
          this.onToast?.(t('forge_toast_ore_changed'));
          return;
        }
        spent.push([oreId, count]);
      }
      const composition = [...selection.entries()].map(([oreId, count]) => ({ ore: ORES[oreId], count }));
      this._forgeActive = true;
      this._activeComposition = composition;
      this._runForge(composition, selectedType);
    });
    this.bodyEl.appendChild(startBtn);
    updateTotal();
  }

  // ---------- Mini-game sequence ----------
  async _runForge(composition, type) {
    try {
      const scores = {};
      scores.heat = await this._stageHeating();
      if (!this.isOpen) return;
      await wait(180); // brief pause so a fast final tap can't "click through" into the next stage's button
      scores.hammer = await this._stageHammering();
      if (!this.isOpen) return;
      await wait(180);
      scores.shape = await this._stageShaping();
      if (!this.isOpen) return;
      await wait(180);
      scores.temper = await this._stageTempering();
      if (!this.isOpen) return;
      await wait(180);

      const quality = Math.max(0, Math.min(100,
        scores.heat * 0.25 + scores.hammer * 0.30 + scores.shape * 0.25 + scores.temper * 0.20
      ));

      const pickaxe = PICKAXES[this.inventory.pickaxeId] ?? PICKAXES.stone;
      const luck = this.getLuck() ?? pickaxe.luck;
      const item = rollForgeResult({ composition, type, quality, luck });
      this.inventory.addEquipment(item);
      if (this.inventory.addXp(15)) this.onToast?.(t('forge_toast_level_up', { level: this.inventory.level }));
      this._forgeActive = false;
      this._activeComposition = null;
      this._renderResult(item, scores);
    } catch (err) {
      // Something broke mid-forge (bad browser API support, unexpected data,
      // etc). Refund the ore instead of silently eating it, and surface the
      // failure instead of leaving the modal stuck with no result.
      console.error('[Pixelforge] Forging failed:', err);
      for (const c of composition) this.inventory.addOre(c.ore.id, c.count);
      this._forgeActive = false;
      this._activeComposition = null;
      this.bodyEl.innerHTML = '';
      appendAll(this.bodyEl,
        el('h2', 'forge-title', t('forge_broken_title')),
        el('p', 'forge-sub', t('forge_broken_sub'))
      );
      const backBtn = el('button', 'forge-start-btn', t('common_back'));
      backBtn.addEventListener('click', () => this._renderSelect());
      this.bodyEl.appendChild(backBtn);
    }
  }

  _stageHeader(label, hint) {
    this.bodyEl.innerHTML = '';
    appendAll(this.bodyEl, el('h2', 'forge-title', label), el('p', 'forge-sub', hint));
  }

  // Stage 1 — keep the gauge inside the optimal zone while it heats up.
  _stageHeating() {
    return new Promise((resolve) => {
      this._stageHeader(t('forge_stage_heating'), t('forge_stage_heating_hint'));
      const track = el('div', 'forge-gauge');
      const fill = el('div', 'forge-gauge-fill');
      const zone = el('div', 'forge-gauge-zone');
      zone.style.left = '50%'; zone.style.width = '38%';
      appendAll(track, fill, zone);
      const btn = el('button', 'forge-action-btn', t('forge_stoke_btn'));
      appendAll(this.bodyEl, track, btn);

      let temp = 15, held = false, elapsed = 0, inZone = 0;
      const DURATION = 5000;
      btn.addEventListener('pointerdown', (e) => { e.preventDefault(); held = true; });
      const release = () => { held = false; };
      btn.addEventListener('pointerup', release);
      btn.addEventListener('pointerleave', release);

      let last = performance.now();
      const tickFn = (t) => {
        if (!this.isOpen) return;
        const dt = Math.min(0.05, (t - last) / 1000);
        last = t;
        temp += (held ? 120 : -45) * dt;
        temp = Math.max(0, Math.min(100, temp));
        fill.style.width = temp + '%';
        const zoneMin = 50, zoneMax = 88;
        if (temp >= zoneMin && temp <= zoneMax) { inZone += dt; fill.classList.add('good'); }
        else fill.classList.remove('good');
        elapsed += dt * 1000;
        if (elapsed < DURATION) {
          requestAnimationFrame(tickFn);
        } else {
          const score = Math.min(100, (inZone / (DURATION / 1000)) * 100 * 1.3);
          resolve(score);
        }
      };
      requestAnimationFrame(tickFn);
    });
  }

  // Stage 2 — tap HIT when the moving marker crosses the target zone. 5 reps.
  _stageHammering() {
    return new Promise((resolve) => {
      this._stageHeader(t('forge_stage_hammering'), t('forge_stage_hammering_hint'));
      const track = el('div', 'forge-gauge forge-gauge--hammer');
      const marker = el('div', 'forge-marker');
      const zoneCenter = 50, zoneWidth = 30;
      const zone = el('div', 'forge-gauge-zone');
      zone.style.left = (zoneCenter - zoneWidth / 2) + '%'; zone.style.width = zoneWidth + '%';
      appendAll(track, zone, marker);
      const btn = el('button', 'forge-action-btn', t('forge_hit_btn'));
      const repEl = el('div', 'forge-rep', t('forge_hit_count', { n: 1 }));
      appendAll(this.bodyEl, track, repEl, btn);

      let rep = 0, total = 0, pos = 0, dir = 1, speed = 70;
      let last = performance.now();
      const raf = (t) => {
        if (!this.isOpen) return;
        const dt = Math.min(0.05, (t - last) / 1000);
        last = t;
        pos += dir * speed * dt;
        if (pos >= 100) { pos = 100; dir = -1; }
        if (pos <= 0) { pos = 0; dir = 1; }
        marker.style.left = pos + '%';
        this._hammerRaf = requestAnimationFrame(raf);
      };
      this._hammerRaf = requestAnimationFrame(raf);

      const onHit = (e) => {
        e.preventDefault();
        const dist = Math.abs(pos - zoneCenter);
        const score = Math.max(0, 100 - dist * 3);
        total += score;
        rep += 1;
        repEl.textContent = t('forge_hit_count', { n: Math.min(rep + 1, 5) });
        speed += 8;
        if (rep >= 5) {
          cancelAnimationFrame(this._hammerRaf);
          btn.removeEventListener('pointerdown', onHit);
          resolve(total / 5);
        }
      };
      btn.addEventListener('pointerdown', onHit);
    });
  }

  // Stage 3 — press the matching direction before the timer runs out. 5 reps.
  _stageShaping() {
    return new Promise((resolve) => {
      this._stageHeader(t('forge_stage_shaping'), t('forge_stage_shaping_hint'));
      const promptEl = el('div', 'forge-shape-prompt', '?');
      const timerWrap = el('div', 'forge-gauge');
      const timerFill = el('div', 'forge-gauge-fill');
      appendAll(timerWrap, timerFill);
      const repEl = el('div', 'forge-rep', t('forge_shape_count', { n: 1 }));
      const dirGrid = el('div', 'forge-dir-grid');
      const buttons = {};
      for (const key of ['up', 'left', 'down', 'right']) {
        const b = el('button', `forge-dir-btn forge-dir-${key}`, `<img class="icon-inline icon-inline--lg" src="${ARROW_ICONS[key]}" alt="${key}">`);
        buttons[key] = b;
        dirGrid.appendChild(b);
      }
      appendAll(this.bodyEl, promptEl, timerWrap, repEl, dirGrid);

      let rep = 0, total = 0, current = null, roundActive = false;
      const ROUND_MS = 1500;
      let roundStart = 0;

      const nextRound = () => {
        rep += 1;
        if (rep > 5) {
          resolve(total / 5);
          return;
        }
        repEl.textContent = t('forge_shape_count', { n: rep });
        const keys = Object.keys(ARROW_ICONS);
        current = keys[Math.floor(Math.random() * keys.length)];
        promptEl.innerHTML = `<img class="icon-inline icon-inline--xl" src="${ARROW_ICONS[current]}" alt="${current}">`;
        roundStart = performance.now();
        roundActive = true;
        requestAnimationFrame(timerLoop);
      };

      const timerLoop = (t) => {
        if (!this.isOpen || !roundActive) return;
        const elapsed = t - roundStart;
        const remain = Math.max(0, 1 - elapsed / ROUND_MS);
        timerFill.style.width = (remain * 100) + '%';
        if (elapsed >= ROUND_MS) {
          roundActive = false;
          total += 0; // timed out
          nextRound();
        } else {
          requestAnimationFrame(timerLoop);
        }
      };

      for (const key of Object.keys(ARROW_ICONS)) {
        buttons[key].addEventListener('pointerdown', (e) => {
          e.preventDefault();
          if (!roundActive) return;
          roundActive = false;
          const elapsed = performance.now() - roundStart;
          const remainRatio = Math.max(0, 1 - elapsed / ROUND_MS);
          const score = key === current ? Math.max(55, 100 * remainRatio) : 0;
          total += score;
          nextRound();
        });
      }

      nextRound();
    });
  }

  // Stage 4 — single falling gauge, tap QUENCH once inside the target zone.
  _stageTempering() {
    return new Promise((resolve) => {
      this._stageHeader(t('forge_stage_tempering'), t('forge_stage_tempering_hint'));
      const track = el('div', 'forge-gauge');
      const fill = el('div', 'forge-gauge-fill forge-gauge-fill--temper');
      const zoneCenter = 30, zoneWidth = 26;
      const zone = el('div', 'forge-gauge-zone forge-gauge-zone--temper');
      zone.style.left = (zoneCenter - zoneWidth / 2) + '%'; zone.style.width = zoneWidth + '%';
      appendAll(track, fill, zone);
      const btn = el('button', 'forge-action-btn', t('forge_quench_btn'));
      appendAll(this.bodyEl, track, btn);

      let value = 100, done = false;
      const DURATION = 5000;
      let start = performance.now();

      const raf = (t) => {
        if (!this.isOpen || done) return;
        const elapsed = t - start;
        value = Math.max(0, 100 - (elapsed / DURATION) * 100);
        fill.style.width = value + '%';
        if (value <= 0 && !done) {
          done = true;
          resolve(0);
          return;
        }
        requestAnimationFrame(raf);
      };
      requestAnimationFrame(raf);

      btn.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        if (done) return;
        done = true;
        btn.disabled = true;
        const dist = Math.abs(value - zoneCenter);
        const score = Math.max(0, 100 - dist * 2.6);
        resolve(score);
      });
    });
  }

  // ---------- Result screen ----------
  _renderResult(item, scores) {
    this.bodyEl.innerHTML = '';
    const card = el('div', `forge-result-card rarity-${item.rarity}`);
    card.style.setProperty('--rarity-color', item.rarityColor.includes('gradient') ? 'transparent' : item.rarityColor);
    if (item.rarityColor.includes('gradient')) card.style.background = item.rarityColor;

    const statLines = Object.entries(item.stats).map(([key, val]) => {
      if (key === 'attack') return `<li>${t('forge_stat_atk', { value: val })}</li>`;
      if (key === 'hp') return `<li>${t('forge_stat_hp', { value: val })}</li>`;
      if (key === 'defense') return `<li>${t('forge_stat_def', { value: val })}</li>`;
      const meta = item.statLabels[key];
      return `<li>${meta?.label ?? key} +${val}${meta?.suffix ?? ''}</li>`;
    }).join('');

    const compositionLine = formatOreComposition(item);

    card.innerHTML = `
      <div class="forge-result-rarity">${item.rarityLabel}</div>
      <div class="forge-result-name">${item.name}</div>
      <div class="forge-result-quality">${t('forge_quality_line', { value: item.quality, label: item.qualityLabel })}</div>
      ${compositionLine ? `<div class="forge-result-composition">${compositionLine}</div>` : ''}
      <ul class="forge-result-stats">${statLines}</ul>
      ${item.specialEffectLabel ? `<div class="forge-result-effect"><img class="icon-inline" src="${UI_ICON_PATHS.sparkles}" alt=""> ${item.specialEffectLabel}<br><span>${item.specialEffectDesc}</span></div>` : ''}
      <div class="forge-result-value">${t('forge_value_line', { value: item.value })}</div>
    `;

    const scoreBreakdown = el('p', 'forge-sub',
      t('forge_score_breakdown', { heat: Math.round(scores.heat), hammer: Math.round(scores.hammer), shape: Math.round(scores.shape), temper: Math.round(scores.temper) })
    );

    const claimBtn = el('button', 'forge-start-btn', t('forge_claim_btn'));
    claimBtn.addEventListener('click', () => this._renderSelect());
    const viewBtn = el('button', 'forge-type-btn', `<img class="icon-inline" src="${UI_ICON_PATHS.backpack}" alt=""> ${t('forge_view_inventory_btn')}`);
    viewBtn.addEventListener('click', () => {
      this.close();
      this.onViewInventory?.();
    });
    const doneBtn = el('button', 'forge-type-btn', t('common_done'));
    doneBtn.addEventListener('click', () => this.close());

    appendAll(this.bodyEl, el('h2', 'forge-title', t('forge_complete_title')), card, scoreBreakdown, claimBtn, viewBtn, doneBtn);
  }
}
