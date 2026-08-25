// src/ui/joystick.js
export class Joystick {
  constructor(baseEl, knobEl) {
    this.base = baseEl;
    this.knob = knobEl;
    this.active = false;
    this.vx = 0;
    this.vy = 0;
    this.pointerId = null;
    this.maxDist = 40;

    baseEl.addEventListener('pointerdown', this.onDown.bind(this));
    window.addEventListener('pointermove', this.onMove.bind(this));
    window.addEventListener('pointerup', this.onUp.bind(this));
    window.addEventListener('pointercancel', this.onUp.bind(this));
  }

  onDown(e) {
    this.active = true;
    this.pointerId = e.pointerId;
    this.base.setPointerCapture?.(e.pointerId);
    this.updateFromEvent(e);
  }

  onMove(e) {
    if (!this.active || e.pointerId !== this.pointerId) return;
    this.updateFromEvent(e);
  }

  onUp(e) {
    if (e.pointerId !== this.pointerId) return;
    this.active = false;
    this.pointerId = null;
    this.vx = 0;
    this.vy = 0;
    this.knob.style.transform = 'translate(0px, 0px)';
  }

  updateFromEvent(e) {
    const rect = this.base.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    let dx = e.clientX - cx;
    let dy = e.clientY - cy;
    const dist = Math.min(this.maxDist, Math.hypot(dx, dy));
    const angle = Math.atan2(dy, dx);
    dx = Math.cos(angle) * dist;
    dy = Math.sin(angle) * dist;
    this.knob.style.transform = `translate(${dx}px, ${dy}px)`;
    this.vx = dx / this.maxDist;
    this.vy = dy / this.maxDist;
  }

  getVector() {
    return { x: this.vx, y: this.vy };
  }
}

// Simple hold/tap button used for Mine / Interact / Attack.
export class ActionButton {
  constructor(el) {
    this.el = el;
    this.held = false;
    this.onTapCb = null;
    this._pointerId = null;

    el.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      this.held = true;
      this._pointerId = e.pointerId;
      // Pointer capture keeps pointerup/pointercancel firing on THIS element
      // even if the touch point visually drifts outside its (round) bounds
      // during a tap — ordinary finger jitter. Without this, pointerleave
      // fired before pointerup on many mobile browsers and silently reset
      // `held` to false first, so the tap callback below never ran — mining
      // still "worked" because the engine reads `.held` continuously every
      // frame rather than depending on a release event, but every menu that
      // depends on onTap() (Blacksmith/Shop/Storage/Auction House) did not.
      el.setPointerCapture?.(e.pointerId);
      el.classList.add('active');
    });
    const release = (e) => {
      if (this._pointerId !== null && e.pointerId !== this._pointerId) return;
      const wasHeld = this.held;
      this.held = false;
      this._pointerId = null;
      el.classList.remove('active');
      if (wasHeld && this.onTapCb) this.onTapCb();
    };
    el.addEventListener('pointerup', release);
    el.addEventListener('pointercancel', release);
  }

  onTap(cb) { this.onTapCb = cb; }
}
