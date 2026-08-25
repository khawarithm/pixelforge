// src/ui/menu.js
// The very first screen shown on boot, before the username prompt / game
// canvas. Purely DOM — see index.html for the #main-menu markup.

export class MainMenu {
  constructor({ rootEl, startBtn, howtoBtn, creditsBtn, howtoModal, howtoCloseBtn, howtoBackdrop, creditsModal, creditsCloseBtn, creditsBackdrop }) {
    this.rootEl = rootEl;
    this.howtoModal = howtoModal;
    this.creditsModal = creditsModal;

    startBtn.addEventListener('click', () => this._resolveStart?.());
    howtoBtn.addEventListener('click', () => this._openModal(howtoModal));
    creditsBtn.addEventListener('click', () => this._openModal(creditsModal));
    howtoCloseBtn.addEventListener('click', () => this._closeModal(howtoModal));
    howtoBackdrop.addEventListener('click', () => this._closeModal(howtoModal));
    creditsCloseBtn.addEventListener('click', () => this._closeModal(creditsModal));
    creditsBackdrop.addEventListener('click', () => this._closeModal(creditsModal));
  }

  _openModal(modal) { modal.classList.remove('hidden'); }
  _closeModal(modal) { modal.classList.add('hidden'); }

  // Shows the menu and resolves once the player taps "Start Game".
  show() {
    this.rootEl.classList.remove('hidden');
    return new Promise((resolve) => {
      this._resolveStart = () => {
        this.howtoModal.classList.add('hidden');
        this.creditsModal.classList.add('hidden');
        this.rootEl.classList.add('hidden');
        resolve();
      };
    });
  }
}
