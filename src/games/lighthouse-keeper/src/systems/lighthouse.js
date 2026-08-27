// Lighthouse health: 100 HP. Any enemy whose center enters the 30-pixel
// radius around the lighthouse center deals 10 damage per second (10/60 per
// frame) and is destroyed on contact. Taking damage pulses the beacon: a
// bright amber flash that fades over PULSE_DURATION seconds.

import { LIGHTHOUSE_X, LIGHTHOUSE_Y, LIGHTHOUSE_RADIUS } from "./beam.js";
import { spawnExplosion } from "./explosions.js";

const MAX_HP = 100;
const DAMAGE_RATE = 10; // damage/s per enemy inside the radius
const PULSE_DURATION = 0.3; // seconds the damage flash lasts

let hp = MAX_HP;
let pulseTimer = 0;

// Damage the lighthouse for any enemy inside the radius. Enemies that reach
// the lighthouse center are destroyed (removed from the scene). Returns the
// current HP.
export function updateLighthouse(dt, enemies) {
  if (pulseTimer > 0) pulseTimer = Math.max(0, pulseTimer - dt);

  let damaged = false;
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    if (e.dying) continue; // dissolving enemies no longer deal damage
    const dist = Math.hypot(e.x - LIGHTHOUSE_X, e.y - LIGHTHOUSE_Y);
    if (dist <= LIGHTHOUSE_RADIUS) {
      hp -= DAMAGE_RATE * dt;
      damaged = true;
      // Destroy the enemy once it reaches the lighthouse center: it dissolves
      // with an explosion instead of vanishing instantly.
      if (dist <= 5 && !e.dying) {
        e.startDying();
        spawnExplosion(e.x, e.y, e.radius, e.color);
      }
    }
  }
  if (damaged) pulseTimer = PULSE_DURATION;
  return hp;
}

export function getLighthouseHP() {
  return hp;
}

// Debug/testing hook: set the lighthouse HP directly.
export function setLighthouseHP(value) {
  hp = value;
}

export function isLighthouseDestroyed() {
  return hp <= 0;
}

// Bright amber flash over the beacon's inner circle while the damage pulse
// is active. The inner circle (radius 12 in the sprite) flares brighter and
// slightly larger, then fades back.
export function drawLighthousePulse(ctx) {
  if (pulseTimer <= 0) return;
  const t = pulseTimer / PULSE_DURATION; // 1 -> 0 as the pulse fades
  ctx.save();
  ctx.globalAlpha = 0.85 * t;
  ctx.fillStyle = "#ffd27a";
  ctx.beginPath();
  ctx.arc(LIGHTHOUSE_X, LIGHTHOUSE_Y, 12 + 8 * (1 - t), 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
