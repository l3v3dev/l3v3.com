import wispAsset from "../../assets/enemy-wisp.svg";
import shroudAsset from "../../assets/enemy-shroud.svg";
import mawAsset from "../../assets/enemy-maw.svg";
// A fog enemy: a soft blob of overlapping circles that homes toward the
// lighthouse center at (400, 300). Three types with distinct size, HP, and speed.

// Base movement speeds (px/s) for each enemy type. Tuned so the player has
// time to reposition, aim, and land shots before enemies reach the lighthouse.
export const WISP_SPEED = 50;
export const SHROUD_SPEED = 35;
export const MAW_SPEED = 25;

export const ENEMY_TYPES = {
  wisp: {
    radius: 16,
    hp: 2,
    speed: WISP_SPEED,
    color: "#8899aa",
    opacity: 0.4,
    sprite: wispAsset,
    spriteSize: 32, // SVG viewBox is 32x32, blob fills it
  },
  shroud: {
    radius: 28,
    hp: 5,
    speed: SHROUD_SPEED,
    color: "#6b7d8e",
    opacity: 0.6,
    sprite: shroudAsset,
    spriteSize: 56,
  },
  maw: {
    radius: 44,
    hp: 12,
    speed: MAW_SPEED,
    color: "#4a5a6a",
    opacity: 0.75,
    sprite: mawAsset,
    spriteSize: 88,
  },
};

const TARGET_X = 400;
const TARGET_Y = 300;

export const DEATH_DURATION = 0.45; // seconds the dissolve animation lasts
const HIT_FLASH_DURATION = 0.12;

export class Enemy {
  constructor(type, x, y, hpScale = 1) {
    const def = ENEMY_TYPES[type];
    if (!def) throw new Error(`Unknown enemy type: ${type}`);
    this.type = type;
    this.x = x;
    this.y = y;
    this.radius = def.radius;
    this.hp = def.hp * hpScale;
    this.maxHp = def.hp * hpScale;
    this.speed = def.speed;
    this.color = def.color;
    this.opacity = def.opacity;
    this.sprite = new Image();
    this.sprite.src = def.sprite;
    this.spriteSize = def.spriteSize;
    this.dying = false;
    this.deathTimer = 0;
    this.hitFlash = 0;
  }

  // Mark this enemy as killed: it stops moving and dissolves over
  // DEATH_DURATION seconds. Returns true if it was already dying.
  startDying() {
    if (this.dying) return true;
    this.dying = true;
    this.deathTimer = DEATH_DURATION;
    return false;
  }

  // True once the dissolve animation has fully played out.
  get fullyDead() {
    return this.dying && this.deathTimer <= 0;
  }

  // Apply damage and flash; the death transition (dissolve + explosion +
  // loot) is handled by the enemy system, which owns the single point where
  // deaths are finalized. Returns true if this hit brought HP to 0.
  takeDamage(amount = 1) {
    this.hp -= amount;
    // Only flash when not already flashing, so continuous beam damage doesn't
    // hold the flash at full strength.
    if (this.hitFlash <= 0) this.hitFlash = HIT_FLASH_DURATION;
    return this.hp <= 0;
  }

  update(dt, slowFactor = 1) {
    if (this.dying) {
      this.deathTimer -= dt;
      return;
    }
    if (this.hitFlash > 0) this.hitFlash = Math.max(0, this.hitFlash - dt);
    // Always move directly toward the lighthouse center at this enemy's speed,
    // scaled by slowFactor (e.g. 0.5 while standing in a fog wisp's aura).
    const dx = TARGET_X - this.x;
    const dy = TARGET_Y - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 0.0001) {
      this.x += (dx / dist) * this.speed * slowFactor * dt;
      this.y += (dy / dist) * this.speed * slowFactor * dt;
    }
  }

  draw(ctx) {
    // Dissolve: fade out while scaling up and drifting slightly upward.
    let alpha = 1;
    let scale = 1;
    let dy = 0;
    if (this.dying) {
      const t = Math.max(0, this.deathTimer) / DEATH_DURATION; // 1 -> 0
      alpha = t;
      scale = 1 + (1 - t) * 0.5;
      dy = (1 - t) * 10;
    }
    if (this.sprite.complete && this.sprite.naturalWidth > 0) {
      const half = (this.spriteSize * scale) / 2;
      ctx.globalAlpha = alpha;
      ctx.drawImage(this.sprite, this.x - half, this.y - half + dy, half * 2, half * 2);
      ctx.globalAlpha = 1;
    } else {
      // Fallback until the sprite loads: a soft blob of overlapping circles.
      ctx.globalAlpha = this.opacity * alpha;
      ctx.fillStyle = this.color;
      const r = this.radius * scale;
      for (const [ox, oy, cr] of [
        [0, 0, r * 0.7],
        [-r * 0.3, -r * 0.2, r * 0.55],
        [r * 0.3, -r * 0.2, r * 0.55],
        [-r * 0.2, r * 0.25, r * 0.5],
        [r * 0.2, r * 0.25, r * 0.5],
      ]) {
        ctx.beginPath();
        ctx.arc(this.x + ox, this.y + oy + dy, cr, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    // Brief white flash when hit (skipped while dissolving).
    if (this.hitFlash > 0 && !this.dying) {
      const t = this.hitFlash / HIT_FLASH_DURATION; // 1 -> 0
      ctx.globalAlpha = 0.5 * t;
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius * scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }
}
