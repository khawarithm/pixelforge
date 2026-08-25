// src/combat/enemy.js
// idle -> chase -> attack -> (recover via attackCooldown) -> chase/idle
// Deliberately simple: no pathfinding, straight-line chase with a leash
// distance back to spawn. Fine at dungeon scale (a handful of enemies), not
// meant to scale to hundreds on a mobile client (per the brief's perf notes).

export class Enemy {
  constructor(def, x, y) {
    this.defId = def.id;
    this.name = def.name;
    this.maxHp = def.hp;
    this.hp = def.hp;
    this.damage = def.damage;
    this.defense = def.defense;
    this.speed = def.speed;
    this.attackRange = def.attackRange;
    this.detectRadius = def.detectRadius ?? 110;
    this.attackCooldown = def.attackCooldown ?? 1200;
    this.color = def.color;
    this.size = def.size ?? 10;
    this.isBoss = !!def.isBoss;
    this.lootTable = def.lootTable;
    this.xp = def.xp ?? 0;

    this.spawnX = x;
    this.spawnY = y;
    this.x = x;
    this.y = y;
    this.state = 'idle';
    this.attackTimer = 0;
    this.dead = false;
    this.hitFlash = 0;
  }

  // Returns { type: 'enemyAttack', damage } the frame it lands a hit, else null.
  update(dt, player) {
    if (this.dead) return null;
    const dx = player.x - this.x, dy = player.y - this.y;
    const dist = Math.hypot(dx, dy);
    this.attackTimer = Math.max(0, this.attackTimer - dt * 1000);
    this.hitFlash = Math.max(0, this.hitFlash - dt);

    const leash = this.detectRadius * 1.8;
    const distFromSpawn = Math.hypot(this.x - this.spawnX, this.y - this.spawnY);

    switch (this.state) {
      case 'idle':
        if (dist < this.detectRadius) this.state = 'chase';
        break;

      case 'chase':
        if (distFromSpawn > leash) { this.state = 'idle'; break; }
        if (dist <= this.attackRange) { this.state = 'attack'; break; }
        if (dist > 0) {
          this.x += (dx / dist) * this.speed * dt;
          this.y += (dy / dist) * this.speed * dt;
        }
        break;

      case 'attack':
        if (dist > this.attackRange * 1.4) { this.state = 'chase'; break; }
        if (this.attackTimer <= 0) {
          this.attackTimer = this.attackCooldown;
          return { type: 'enemyAttack', damage: this.damage };
        }
        break;
    }
    return null;
  }

  takeDamage(amount) {
    this.hp = Math.max(0, this.hp - amount);
    this.hitFlash = 0.15;
    if (this.hp <= 0) this.dead = true;
  }
}
