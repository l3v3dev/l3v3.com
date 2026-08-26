// Manages fog enemies: spawns them just outside the canvas edges, moves them
// toward the lighthouse center each frame, resolves lantern-bolt collisions
// (1 damage per hit, bolt consumed), and removes dead enemies.

import { Enemy } from "../entities/Enemy.js";
import { collideBoltsWithEnemies } from "./bolts.js";
import { spawnWispParticles, isSlowed, getWispSlowFactor } from "./wispParticles.js";
import { spawnExplosion } from "./explosions.js";

const CANVAS_W = 800;
const CANVAS_H = 600;
const SPAWN_OFFSET = 20; // how far outside the edge enemies appear

const enemies = [];

// Spawn one enemy of the given type at a random position just outside a
// random canvas edge. hpScale multiplies the type's base HP (wave scaling).
export function spawnEnemy(type, hpScale = 1) {
  const edge = Math.floor(Math.random() * 4);
  let x, y;
  if (edge === 0) {
    x = Math.random() * CANVAS_W;
    y = -SPAWN_OFFSET;
  } else if (edge === 1) {
    x = CANVAS_W + SPAWN_OFFSET;
    y = Math.random() * CANVAS_H;
  } else if (edge === 2) {
    x = Math.random() * CANVAS_W;
    y = CANVAS_H + SPAWN_OFFSET;
  } else {
    x = -SPAWN_OFFSET;
    y = Math.random() * CANVAS_H;
  }
  enemies.push(new Enemy(type, x, y, hpScale));
}

export function updateEnemies(dt) {
  // Death transition: any enemy whose HP hit 0 starts its dissolve, spawns an
  // explosion, and drops its death loot (fog wisps / split wisps).
  for (const enemy of enemies) {
    if (enemy.hp <= 0 && !enemy.dying) {
      enemy.startDying();
      spawnExplosion(enemy.x, enemy.y, enemy.radius, enemy.color);
      onEnemyDeath(enemy);
    }
  }

  for (const enemy of enemies) {
    if (enemy.dying) {
      enemy.update(dt); // ages the dissolve timer, no movement
      continue;
    }
    // Enemies within 40px of an active fog wisp move at half speed; the slow
    // does not stack across overlapping wisps.
    const slowFactor = isSlowed(enemy.x, enemy.y) ? getWispSlowFactor() : 1;
    enemy.update(dt, slowFactor);
  }

  // Bolts overlapping an enemy deal 1 damage and are consumed.
  collideBoltsWithEnemies(enemies);

  // Remove enemies whose dissolve animation has fully played out.
  for (let i = enemies.length - 1; i >= 0; i--) {
    if (enemies[i].fullyDead) enemies.splice(i, 1);
  }
}

// Death drops: Shrouds and Maws each leave 2 fog wisp particles at the death
// location; a Maw additionally splits into 2 new Wisp enemies.
function onEnemyDeath(enemy) {
  if (enemy.type === "shroud" || enemy.type === "maw") {
    spawnWispParticles(enemy.x, enemy.y, 2);
  }
  if (enemy.type === "maw") {
    enemies.push(new Enemy("wisp", enemy.x, enemy.y));
    enemies.push(new Enemy("wisp", enemy.x, enemy.y));
  }
}

export function drawEnemies(ctx) {
  for (const enemy of enemies) enemy.draw(ctx);
}

export function getEnemyCount() {
  return enemies.length;
}

// Live array, for systems that need to iterate enemies directly (e.g. beam).
export function getEnemies() {
  return enemies;
}

// Lightweight snapshot of living enemies for HUD/debug/testing.
export function getEnemyInfo() {
  return enemies.map((e) => ({ type: e.type, x: e.x, y: e.y, hp: e.hp, maxHp: e.maxHp }));
}
