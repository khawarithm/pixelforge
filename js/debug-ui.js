// src/debug/debug-ui.js
// Thin DOM wrapper around debug/index.js's command engine — a floating tab
// that expands into a small command console. Only ever created when the
// player is eligible (secret username OR the "The End of All" achievement
// — see main.js), so it has zero footprint for every other player.

import { runDebugCommand, helpText } from './debug.js';
import { t } from './i18n.js';

export class DebugConsole {
  constructor({ tabEl, modalEl, logEl, inputEl, runBtnEl, closeBtnEl, backdropEl, inventory, engine }) {
    this.tabEl = tabEl;
    this.modalEl = modalEl;
    this.logEl = logEl;
    this.inputEl = inputEl;
    this.inventory = inventory;
    this.engine = engine ?? null;

    this.tabEl.classList.remove('hidden');
    this.log(t('debug_active_msg'), 'ok');
    this.log(helpText(), 'info');

    this.tabEl.addEventListener('click', () => this.toggle());
    closeBtnEl.addEventListener('click', () => this.close());
    backdropEl?.addEventListener('click', () => this.close());
    runBtnEl.addEventListener('click', () => this.submit());
    this.inputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.submit();
    });
  }

  toggle() {
    this.modalEl.classList.toggle('hidden');
    if (!this.modalEl.classList.contains('hidden')) this.inputEl.focus();
  }

  close() {
    this.modalEl.classList.add('hidden');
  }

  log(message, kind = 'info') {
    const line = document.createElement('div');
    line.className = `debug-log-line debug-log-line--${kind}`;
    line.textContent = message;
    this.logEl.appendChild(line);
    this.logEl.scrollTop = this.logEl.scrollHeight;
  }

  submit() {
    const raw = this.inputEl.value;
    if (!raw.trim()) return;
    this.log('> ' + raw, 'cmd');
    const { ok, message } = runDebugCommand(raw, this.inventory, this.engine);
    this.log(message, ok ? 'ok' : 'err');
    this.inputEl.value = '';
    this.inputEl.focus();
  }
}
