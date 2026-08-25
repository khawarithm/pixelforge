// src/economy/auction-ui.js
import { escapeHtml } from './dom-safe.js';
import { AUCTION_DURATIONS, createListing, resolveListing } from './auction.js';
import { t } from './i18n.js';

function el(tag, className, html) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (html !== undefined) e.innerHTML = html;
  return e;
}
function appendAll(parent, ...nodes) { for (const n of nodes) parent.appendChild(n); }
function safeRarityClass(rarity) { return /^[a-z]+$/.test(rarity) ? rarity : 'common'; }

function formatRemaining(ms) {
  if (ms <= 0) return t('auction_ready');
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return t('auction_hours_left', { h, m });
  return t('auction_time_left', { m, s: String(s).padStart(2, '0') });
}

export class AuctionUI {
  constructor({ modalEl, bodyEl, closeEl, backdropEl, inventory, onOpen, onClose, onToast }) {
    this.modalEl = modalEl;
    this.bodyEl = bodyEl;
    this.inventory = inventory;
    this.onOpen = onOpen;
    this.onClose = onClose;
    this.onToast = onToast;
    this.isOpen = false;
    this._timer = null;
    this._remainingEl = null;
    // Fingerprint of the last full render. Inventory emits change events for
    // all sorts of things (gold ticking up from the auto-drill, ore mined,
    // etc), and previously every single one triggered a full re-render of
    // this modal — wiping out whatever the player had selected/typed in the
    // listing form every second or so. Only actually rebuild the DOM when
    // something that affects THIS screen changed.
    this._lastSignature = null;

    closeEl.addEventListener('click', () => this.close());
    backdropEl.addEventListener('click', () => this.close());
    inventory.onChange(() => { if (this.isOpen) this._maybeRender(); });
  }

  open() {
    if (this.isOpen) return;
    this.isOpen = true;
    this.modalEl.classList.remove('hidden');
    this._lastSignature = null; // force a fresh render on open
    this._maybeRender();
    if (!this.isOpen) return; // _maybeRender closed us again after a render failure
    this.onOpen?.();
  }

  close() {
    if (!this.isOpen) return;
    this.isOpen = false;
    this.modalEl.classList.add('hidden');
    this._stopTimer();
    this.onClose?.();
  }

  _stopTimer() {
    if (this._timer) {
      clearInterval(this._timer);
      this._timer = null;
    }
  }

  _signature() {
    const listing = this.inventory.auction;
    if (listing) return `listing:${listing.listedAt}:${listing.endsAt}`;
    const equipment = Array.isArray(this.inventory.equipment) ? this.inventory.equipment : [];
    return `form:${equipment.map((e) => e?.instanceId).join(',')}`;
  }

  _maybeRender() {
    // The whole thing — signature check included — is guarded. Never let an
    // exception here leave isOpen stuck true, since open() bails out
    // instantly whenever isOpen is already true: a single bad render would
    // otherwise make every future tap on the landmark silently do nothing.
    try {
      const sig = this._signature();
      if (sig === this._lastSignature) return;
      this._lastSignature = sig;
      this._render();
    } catch (err) {
      console.error('[Pixelforge] Auction House render failed:', err);
      this._stopTimer();
      this.bodyEl.innerHTML = '';
      if (this.isOpen) {
        this.isOpen = false;
        this.modalEl.classList.add('hidden');
        this.onToast?.(t('auction_error_toast'));
        this.onClose?.();
      }
    }
  }

  _render() {
    this._stopTimer();
    this.bodyEl.innerHTML = '';
    appendAll(this.bodyEl, el('h2', 'forge-title', t('auction_title')));

    const listing = this.inventory.auction;
    if (listing) this._renderActiveListing(listing);
    else this._renderListForm();
  }

  // Ticks the on-screen countdown once a second while a listing is pending,
  // without touching the rest of the DOM (see _render's comment above).
  _tick() {
    const listing = this.inventory.auction;
    if (!listing) { this._stopTimer(); return; }
    const remaining = listing.endsAt - Date.now();
    if (remaining <= 0) {
      this._lastSignature = this._signature();
      try {
        this._render();
      } catch (err) {
        console.error('[Pixelforge] Auction House render failed:', err);
        this._stopTimer();
        this.bodyEl.innerHTML = '';
        if (this.isOpen) {
          this.isOpen = false;
          this.modalEl.classList.add('hidden');
          this.onToast?.(t('auction_error_toast'));
          this.onClose?.();
        }
      }
      return;
    }
    if (this._remainingEl) {
      this._remainingEl.textContent = t('auction_asking', { price: listing.startingPrice, remaining: formatRemaining(remaining) });
    }
  }

  _renderActiveListing(listing) {
    const remaining = listing.endsAt - Date.now();
    const item = listing.item;
    const card = el('div', `auction-card rarity-${safeRarityClass(item.rarity)}`);
    card.innerHTML = `
      <div class="auction-card-top">
        <span class="auction-item-name">${escapeHtml(item.name)}</span>
      </div>
      <div class="auction-meta">${t('auction_asking', { price: listing.startingPrice, remaining: formatRemaining(remaining) })}</div>
    `;
    this.bodyEl.appendChild(card);
    this._remainingEl = card.querySelector('.auction-meta');

    if (remaining > 0) {
      appendAll(this.bodyEl, el('p', 'forge-sub', t('auction_wait_hint')));
      this._timer = setInterval(() => this._tick(), 1000);
      return;
    }

    const result = resolveListing(listing);
    const resultCard = el('div', 'dungeon-loot');
    resultCard.textContent = result.sold
      ? t('auction_sold', { price: result.finalPrice })
      : t('auction_not_sold');
    this.bodyEl.appendChild(resultCard);

    const collectBtn = el('button', 'forge-start-btn', t('auction_collect_btn'));
    collectBtn.addEventListener('click', () => {
      if (result.sold) {
        this.inventory.addGold(result.finalPrice);
      } else {
        this.inventory.addEquipment(item);
      }
      this.inventory.setAuction(null);
      this.onToast?.(result.sold ? t('auction_toast_sold', { price: result.finalPrice }) : t('auction_toast_returned'));
    });
    this.bodyEl.appendChild(collectBtn);
  }

  _renderListForm() {
    const equipment = Array.isArray(this.inventory.equipment) ? this.inventory.equipment : [];
    if (equipment.length === 0) {
      appendAll(this.bodyEl, el('p', 'forge-empty', t('auction_no_equipment')));
      return;
    }
    appendAll(this.bodyEl, el('p', 'forge-sub', t('auction_list_hint')));

    let selected = null, duration = AUCTION_DURATIONS[0].ms;
    const grid = el('div', 'forge-ore-grid');
    for (const item of equipment) {
      const card = el('button', `forge-ore-card rarity-${safeRarityClass(item.rarity)}`);
      card.innerHTML = `<span class="name">${escapeHtml(item.name)}</span><span class="count">${item.value}${escapeHtml(t('auction_value_suffix'))}</span>`;
      card.addEventListener('click', () => {
        grid.querySelectorAll('.forge-ore-card').forEach((c) => c.classList.remove('selected'));
        card.classList.add('selected');
        selected = item;
        priceInput.value = String(Math.max(1, Math.round(item.value * 0.9)));
        listBtn.disabled = false;
      });
      grid.appendChild(card);
    }
    this.bodyEl.appendChild(grid);

    const priceInput = el('input', 'auction-bid-input');
    priceInput.type = 'number';
    priceInput.min = '1';
    priceInput.placeholder = t('auction_price_placeholder');
    this.bodyEl.appendChild(priceInput);

    const durationRow = el('div', 'forge-type-row');
    AUCTION_DURATIONS.forEach((d, i) => {
      const btn = el('button', `forge-type-btn${i === 0 ? ' selected' : ''}`, t(d.labelKey));
      btn.addEventListener('click', () => {
        duration = d.ms;
        durationRow.querySelectorAll('.forge-type-btn').forEach((b) => b.classList.remove('selected'));
        btn.classList.add('selected');
      });
      durationRow.appendChild(btn);
    });
    this.bodyEl.appendChild(durationRow);

    const listBtn = el('button', 'forge-start-btn', t('auction_list_btn'));
    listBtn.disabled = true;
    listBtn.addEventListener('click', () => {
      if (!selected) return;
      const price = parseInt(priceInput.value, 10);
      if (!Number.isFinite(price) || price < 1) {
        this.onToast?.(t('auction_toast_invalid_price'));
        return;
      }
      const item = this.inventory.removeEquipment(selected.instanceId);
      if (!item) return;
      this.inventory.setAuction(createListing(item, price, duration));
      this.onToast?.(t('auction_toast_listed'));
    });
    this.bodyEl.appendChild(listBtn);
  }
}
