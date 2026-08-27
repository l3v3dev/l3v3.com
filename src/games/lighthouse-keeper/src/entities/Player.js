import keeperAsset from "../../assets/keeper.svg";
// The keeper: a 24px-diameter circle moving at 200 px/s in the combined
// direction of held WASD keys (diagonals normalized), clamped to the
// 800x600 play area.

import { getHeldKeys } from "../systems/input.js";

const RADIUS = 12;
const SPEED = 200; // px/s

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = RADIUS;
    this.sprite = new Image();
    this.sprite.src = keeperAsset;
  }

  update(dt, bounds) {
    const held = getHeldKeys();
    let dx = 0;
    let dy = 0;
    if (held.has("a")) dx -= 1;
    if (held.has("d")) dx += 1;
    if (held.has("w")) dy -= 1;
    if (held.has("s")) dy += 1;

    if (dx !== 0 || dy !== 0) {
      const len = Math.hypot(dx, dy); // normalizes diagonals to the same speed
      this.x += (dx / len) * SPEED * dt;
      this.y += (dy / len) * SPEED * dt;
    }

    // Clamp so the full circle stays inside the bounds.
    this.x = Math.min(Math.max(this.x, this.radius), bounds.width - this.radius);
    this.y = Math.min(Math.max(this.y, this.radius), bounds.height - this.radius);
  }

  draw(ctx) {
    if (this.sprite.complete && this.sprite.naturalWidth > 0) {
      // Sprite is 32x32 with the 24px circle centered - draw at 1:1 scale.
      ctx.drawImage(this.sprite, this.x - 16, this.y - 16, 32, 32);
    } else {
      // Fallback until the sprite loads.
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = "#f0e6d3";
      ctx.fill();
    }
  }
}
