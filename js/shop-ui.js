// src/economy/shop-ui.js
import { ORES } from './ore-config.js';
import { PICKAXES, AUTO_DRILLS } from './pickaxe-config.js';
import { npcOreSellPrice, npcEquipmentSellPrice, GOLD_SINKS } from './economy.js';
import { getDrillDef } from './auto-drill.js';
import { escapeHtml } from './dom-safe.js';
import { formatOreComposition } from './composition.js';
import { t } from './i18n.js';

function el(tag, className, html) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (html !== undefined) e.innerHTML = html;
  return e;
}
function appendAll(parent, ...nodes) { for (const n of nodes) parent.appendChild(n); }

export class ShopUI {
  constructor({ modalEl, bodyEl, closeEl, backdropEl, inventory, onHealPlayer, onOpen, onClose }) {
    this.modalEl = modalEl;
    this.bodyEl = bodyEl;
    this.inventory = inventory;
    this.onHealPlayer = onHealPlayer;
    this.onOpen = onOpen;
    this.onClose = onClose;
    this.isOpen = false;
    this.tab = 'buy'; // 'buy' | 'sell'

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
      el('h2', 'forge-title', t('shop_title')),
      el('p', 'forge-sub', this.tab === 'buy' ? t('shop_sub_buy') : t('shop_sub_sell'))
    );

    const tabs = el('div', 'shop-tabs');
    const buyBtn = el('button', `shop-tab-btn${this.tab === 'buy' ? ' active' : ''}`, t('shop_tab_buy'));
    const sellBtn = el('button', `shop-tab-btn${this.tab === 'sell' ? ' active' : ''}`, t('shop_tab_sell'));
    buyBtn.addEventListener('click', () => this._setTab('buy'));
    sellBtn.addEventListener('click', () => this._setTab('sell'));
    appendAll(tabs, buyBtn, sellBtn);
    this.bodyEl.appendChild(tabs);

    if (this.tab === 'buy') this._renderBuy();
    else this._renderSell();
  }

  // ---------- Buy tab ----------

  _renderBuy() {
    this._renderBuyPickaxes();
    this._renderBuyDrills();
    this._renderBuyTickets();
    this._renderBuyPotions();
  }

  _renderBuyPickaxes() {
    const level = this.inventory.level;
    const currentTier = PICKAXES[this.inventory.pickaxeId]?.tier ?? 0;
    appendAll(this.bodyEl, el('h3', 'inv-subheading', t('shop_section_pickaxes')));
    const list = el('div', 'shop-list');
    for (const def of Object.values(PICKAXES).sort((a, b) => a.tier - b.tier)) {
      if (def.tier <= currentTier) continue; // already own this tier or better
      const meetsLevel = level >= def.levelReq;
      const canAfford = this.inventory.gold >= def.price;
      const row = el('div', 'shop-row');
      const statLine = t('shop_stat_speed_luck', { speed: def.miningSpeed, luck: Math.round(def.luck * 100) })
        + (def.levelReq > 0 ? t('shop_stat_level_req', { level: def.levelReq }) : '');
      row.innerHTML = `<span class="name-col">
          <span class="name">${def.name}</span>
          <span class="ore-composition">${statLine}</span>
        </span>
        <span class="shop-price">${def.price}g</span>`;
      const btn = el('button', 'shop-sell-btn', meetsLevel ? t('shop_buy_btn') : `Lv.${def.levelReq}`);
      btn.disabled = !meetsLevel || !canAfford;
      btn.addEventListener('click', () => {
        if (!meetsLevel || this.inventory.gold < def.price) return;
        this.inventory.addGold(-def.price);
        this.inventory.setPickaxeId(def.id);
      });
      row.appendChild(btn);
      list.appendChild(row);
    }
    if (!list.children.length) {
      appendAll(this.bodyEl, el('p', 'forge-empty', t('shop_own_best_pickaxe')));
    } else {
      this.bodyEl.appendChild(list);
    }
  }

  _renderBuyDrills() {
    const level = this.inventory.level;
    const currentTier = this.inventory.drill ? (getDrillDef(this.inventory.drill.id)?.tier ?? 0) : 0;
    appendAll(this.bodyEl, el('h3', 'inv-subheading', t('shop_section_drills')));
    appendAll(this.bodyEl, el('p', 'forge-sub', t('shop_drills_desc')));
    const list = el('div', 'shop-list');
    for (const def of Object.values(AUTO_DRILLS).sort((a, b) => a.tier - b.tier)) {
      if (def.tier <= currentTier) continue; // already own this tier or better
      const meetsLevel = level >= def.levelReq;
      const canAfford = this.inventory.gold >= def.price;
      const row = el('div', 'shop-row');
      const statLine = `${t('shop_stat_speed_luck', { speed: def.miningSpeed, luck: Math.round(def.luck * 100) })} \u00b7 `
        + t('shop_stat_drill', { rate: def.offlineRatePerHour, cap: def.storageCapacity })
        + (def.levelReq > 0 ? t('shop_stat_level_req', { level: def.levelReq }) : '');
      row.innerHTML = `<span class="name-col">
          <span class="name">${def.name}</span>
          <span class="ore-composition">${statLine}</span>
        </span>
        <span class="shop-price">${def.price}g</span>`;
      const btn = el('button', 'shop-sell-btn', meetsLevel ? (currentTier > 0 ? t('shop_upgrade_btn') : t('shop_buy_btn')) : `Lv.${def.levelReq}`);
      btn.disabled = !meetsLevel || !canAfford;
      btn.addEventListener('click', () => {
        if (!meetsLevel || this.inventory.gold < def.price) return;
        this.inventory.addGold(-def.price);
        this.inventory.setDrill({ id: def.id });
      });
      row.appendChild(btn);
      list.appendChild(row);
    }
    if (!list.children.length) {
      appendAll(this.bodyEl, el('p', 'forge-empty', t('shop_own_best_drill')));
    } else {
      this.bodyEl.appendChild(list);
    }
  }

  _renderBuyTickets() {
    const price = GOLD_SINKS.dungeonTicketShopPrice;
    appendAll(this.bodyEl, el('h3', 'inv-subheading', t('shop_section_tickets')));
    const list = el('div', 'shop-list');
    const row = el('div', 'shop-row');
    row.innerHTML = `<span class="name-col">
        <span class="name">${t('shop_ticket_name')} <span class="count">x${this.inventory.dungeonTickets}</span></span>
        <span class="ore-composition">${t('shop_ticket_desc', { doorPrice: GOLD_SINKS.dungeonTicket, price })}</span>
      </span>
      <span class="shop-price">${price}g</span>`;
    const btn = el('button', 'shop-sell-btn', t('shop_buy_1_btn'));
    btn.disabled = this.inventory.gold < price;
    btn.addEventListener('click', () => {
      if (this.inventory.gold < price) return;
      this.inventory.addGold(-price);
      this.inventory.addDungeonTickets(1);
    });
    row.appendChild(btn);
    list.appendChild(row);
    this.bodyEl.appendChild(list);
  }

  _renderBuyPotions() {
    const price = GOLD_SINKS.healthPotion;
    appendAll(this.bodyEl, el('h3', 'inv-subheading', t('shop_section_potions')));
    const list = el('div', 'shop-list');
    const row = el('div', 'shop-row');
    row.innerHTML = `<span class="name-col">
        <span class="name">${t('shop_potion_name')}</span>
        <span class="ore-composition">${t('shop_potion_desc')}</span>
      </span>
      <span class="shop-price">${price}g</span>`;
    const btn = el('button', 'shop-sell-btn', t('shop_use_btn'));
    btn.disabled = this.inventory.gold < price;
    btn.addEventListener('click', () => {
      if (this.inventory.gold < price) return;
      this.inventory.addGold(-price);
      this.onHealPlayer?.();
    });
    row.appendChild(btn);
    list.appendChild(row);
    this.bodyEl.appendChild(list);
  }

  // ---------- Sell tab ----------

  _renderSell() {
    const oreEntries = Object.entries(this.inventory.ore).filter(([, c]) => c > 0);
    appendAll(this.bodyEl, el('h3', 'inv-subheading', t('shop_section_sell_ore')));
    if (oreEntries.length === 0) {
      appendAll(this.bodyEl, el('p', 'forge-empty', t('shop_no_ore_to_sell')));
    } else {
      const list = el('div', 'shop-list');
      for (const [oreId, count] of oreEntries) {
        const def = ORES[oreId];
        if (!def) continue;
        const price = npcOreSellPrice(def, count);
        const row = el('div', 'shop-row');
        row.innerHTML = `<span class="swatch" style="background:${def.color}"></span>
          <span class="name">${def.name} <span class="count">x${count}</span></span>
          <span class="shop-price">${price}g</span>`;
        const btn = el('button', 'shop-sell-btn', t('shop_sell_all_btn'));
        btn.addEventListener('click', () => {
          if (this.inventory.spendOre(oreId, count)) this.inventory.addGold(price);
        });
        row.appendChild(btn);
        list.appendChild(row);
      }
      this.bodyEl.appendChild(list);
    }

    appendAll(this.bodyEl, el('h3', 'inv-subheading', t('shop_section_sell_equipment')));
    if (this.inventory.equipment.length === 0) {
      appendAll(this.bodyEl, el('p', 'forge-empty', t('shop_no_equipment_to_sell')));
    } else {
      const list = el('div', 'shop-list');
      for (const item of this.inventory.equipment) {
        const price = npcEquipmentSellPrice(item);
        const compositionLine = formatOreComposition(item);
        const row = el('div', `shop-row rarity-${/^[a-z]+$/.test(item.rarity) ? item.rarity : 'common'}`);
        row.innerHTML = `<span class="name-col">
            <span class="name">${escapeHtml(item.name)}${item.equipped ? escapeHtml(t('equipped_suffix')) : ''}</span>
            ${compositionLine ? `<span class="ore-composition">${escapeHtml(compositionLine)}</span>` : ''}
          </span>
          <span class="shop-price">${price}g</span>`;
        const btn = el('button', 'shop-sell-btn', t('shop_sell_btn'));
        btn.addEventListener('click', () => {
          if (this.inventory.removeEquipment(item.instanceId)) this.inventory.addGold(price);
        });
        row.appendChild(btn);
        list.appendChild(row);
      }
      this.bodyEl.appendChild(list);
    }
  }
}
