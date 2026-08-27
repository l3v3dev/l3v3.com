import lighthouseAsset from "../../assets/lighthouse.svg";
// The lighthouse beam: a 60-degree amber cone sweeping clockwise from the
// lighthouse center at (400, 300). Activated by holding Space, drains a beam
// meter (100 units, 25/s), and deals 5 damage per second to enemies whose
// center falls inside the cone.

import { getHeldKeys } from "./input.js";

export const LIGHTHOUSE_X = 400;
export const LIGHTHOUSE_Y = 300;
export const LIGHTHOUSE_RADIUS = 30; // 60-pixel-diameter circle

const CONE_ANGLE = (60 * Math.PI) / 180; // 60-degree cone
const CONE_LENGTH = 300;
const ROTATION_SPEED = (90 * Math.PI) / 180; // 90 deg/s clockwise
const METER_MAX = 100;
const DRAIN_RATE = 25; // units/s
const DAMAGE_RATE = 5; // damage/s

const lighthouseSprite = new Image();
lighthouseSprite.src = lighthouseAsset;

let active = false;
let meter = METER_MAX;
let angle = 0; // current cone center direction, radians; 0 = pointing right, increasing = clockwise (canvas y is down)

export function updateBeam(dt, enemies) {
  const spaceHeld = getHeldKeys().has(" ");

  if (spaceHeld && meter > 0) {
    active = true;
  } else {
    active = false;
  }

  if (active) {
    angle = (angle + ROTATION_SPEED * dt) % (Math.PI * 2);
    meter = Math.max(0, meter - DRAIN_RATE * dt);
    if (meter <= 0) active = false;

    // Damage enemies whose center point is inside the cone.
    for (const enemy of enemies) {
      const dx = enemy.x - LIGHTHOUSE_X;
      const dy = enemy.y - LIGHTHOUSE_Y;
      const dist = Math.hypot(dx, dy);
      if (dist > CONE_LENGTH) continue;
      let diff = Math.atan2(dy, dx) - angle;
      // Normalize to [-PI, PI].
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      if (Math.abs(diff) <= CONE_ANGLE / 2) {
        enemy.takeDamage(DAMAGE_RATE * dt);
      }
    }
  }
}

export function drawLighthouse(ctx) {
  if (lighthouseSprite.complete && lighthouseSprite.naturalWidth > 0) {
    ctx.drawImage(
      lighthouseSprite,
      LIGHTHOUSE_X - LIGHTHOUSE_RADIUS,
      LIGHTHOUSE_Y - LIGHTHOUSE_RADIUS,
      LIGHTHOUSE_RADIUS * 2,
      LIGHTHOUSE_RADIUS * 2
    );
  } else {
    // Fallback until the sprite loads.
    ctx.fillStyle = "#8b7d6b";
    ctx.beginPath();
    ctx.arc(LIGHTHOUSE_X, LIGHTHOUSE_Y, LIGHTHOUSE_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#a89b8a";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(LIGHTHOUSE_X, LIGHTHOUSE_Y, LIGHTHOUSE_RADIUS - 2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "#f5a623";
    ctx.beginPath();
    ctx.arc(LIGHTHOUSE_X, LIGHTHOUSE_Y, 12, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function drawBeam(ctx) {
  if (!active) return;
  const half = CONE_ANGLE / 2;
  const start = angle - half;
  const end = angle + half;

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(LIGHTHOUSE_X, LIGHTHOUSE_Y);
  ctx.arc(LIGHTHOUSE_X, LIGHTHOUSE_Y, CONE_LENGTH, start, end);
  ctx.closePath();
  ctx.globalAlpha = 0.3;
  ctx.fillStyle = "#f5a623";
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = "#f5a623";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

export function getBeamMeter() {
  return meter;
}

// Refill the meter to full (used during the inter-wave calm).
export function refillBeamMeter() {
  meter = METER_MAX;
}

export function isBeamActive() {
  return active;
}
