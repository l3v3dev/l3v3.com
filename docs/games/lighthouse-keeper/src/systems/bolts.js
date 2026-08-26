// Manages lantern bolts: fires while the left mouse button is held (12 bolts
// per second, one every ~83 ms) toward the mouse cursor, updates/draws all
// active bolts, and removes expired ones. Also draws the thin aim line from
// the player to the cursor.

import { Bolt } from "../entities/Bolt.js";
import { getMouse } from "./input.js";
import { spawnMuzzleFlash, spawnImpactSparks } from "./shootEffects.js";

const FIRE_INTERVAL = 1 / 12; // seconds between bolts

const bolts = [];
let timeSinceLastShot = 0;

export function updateBolts(dt, player) {
  const mouse = getMouse();

  if (mouse.down && mouse.over) {
    timeSinceLastShot += dt;
    while (timeSinceLastShot >= FIRE_INTERVAL) {
      timeSinceLastShot -= FIRE_INTERVAL;
      const angle = Math.atan2(mouse.y - player.y, mouse.x - player.x);
      bolts.push(new Bolt(player.x, player.y, angle));
      spawnMuzzleFlash(player.x, player.y, angle);
    }
  } else {
    timeSinceLastShot = 0;
  }

  for (const bolt of bolts) bolt.update(dt);
  // Remove bolts whose lifetime has expired.
  for (let i = bolts.length - 1; i >= 0; i--) {
    if (bolts[i].expired) bolts.splice(i, 1);
  }
}

export function drawBolts(ctx, player) {
  const mouse = getMouse();

  // Thin 1px aim line from player center toward the cursor.
  if (mouse.over) {
    ctx.beginPath();
    ctx.moveTo(player.x, player.y);
    ctx.lineTo(mouse.x, mouse.y);
    ctx.strokeStyle = "rgba(255, 215, 0, 0.6)";
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  for (const bolt of bolts) bolt.draw(ctx);
}

// Resolve collisions between active bolts and enemies: a bolt overlapping an
// enemy circle deals 1 damage to that enemy and the bolt is removed.
export function collideBoltsWithEnemies(enemies) {
  for (let i = bolts.length - 1; i >= 0; i--) {
    const bolt = bolts[i];
    for (const enemy of enemies) {
      const dx = bolt.x - enemy.x;
      const dy = bolt.y - enemy.y;
      if (dx * dx + dy * dy <= (bolt.radius + enemy.radius) ** 2) {
        enemy.takeDamage(1);
        spawnImpactSparks(bolt.x, bolt.y);
        bolts.splice(i, 1);
        break;
      }
    }
  }
}

export function getBoltCount() {
  return bolts.length;
}
