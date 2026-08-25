// src/entities/player.js
export const DIRECTIONS = ['down', 'left', 'right', 'up'];

export class Player {
  constructor({ x, y, name = 'Player' }) {
    this.x = x;
    this.y = y;
    this.name = name;
    this.speed = 110; // px/sec, modified by armor speed stat later
    this.dir = 'down';
    this.moving = false;
    this.animTime = 0;
    this.animFrame = 0;
    this.radius = 10; // collision radius
    this.action = null; // 'mining' | null — surfaced for potential future use (animations, etc.)
    this.hp = 100;
    this.maxHp = 100;
    this.attackFlash = 0; // brief swing animation timer
    this.hurtFlash = 0;   // brief red flash when taking damage
  }

  applyInput(vx, vy, dt) {
    const len = Math.hypot(vx, vy);
    this.moving = len > 0.05;
    if (this.moving) {
      const nx = vx / len, ny = vy / len;
      this.x += nx * this.speed * dt;
      this.y += ny * this.speed * dt;
      if (Math.abs(vx) > Math.abs(vy)) {
        this.dir = vx > 0 ? 'right' : 'left';
      } else {
        this.dir = vy > 0 ? 'down' : 'up';
      }
      this.animTime += dt;
      if (this.animTime > 0.18) {
        this.animTime = 0;
        this.animFrame = (this.animFrame + 1) % 2;
      }
    } else {
      this.animFrame = 0;
      this.animTime = 0;
    }
  }
}
