// Wave manager: five escalating waves of fog enemies. Each wave's enemies
// spawn in batches of 2-3 every 1.5 seconds. A wave is complete when no
// enemies are alive and no spawns are pending; then a 3-second calm plays
// (beam meter refilled) before the next wave starts. Enemy HP scales by
// 1.2^(wave-1) over the base value.

import { spawnEnemy, getEnemyCount } from "./enemies.js";
import { refillBeamMeter } from "./beam.js";

export const WAVES = [
  { wisp: 6, shroud: 0, maw: 0 },
  { wisp: 8, shroud: 2, maw: 0 },
  { wisp: 6, shroud: 4, maw: 0 },
  { wisp: 4, shroud: 5, maw: 1 },
  { wisp: 3, shroud: 4, maw: 2 },
];

const SPAWN_BATCH_MIN = 2;
const SPAWN_BATCH_MAX = 3;
const SPAWN_INTERVAL = 1.5; // seconds between batches
const CALM_DURATION = 3; // seconds between waves

let wave = 0;
let phase = "idle"; // idle | spawning | calm | done
let queue = []; // pending spawn types for the current wave
let spawnTimer = 0;
let calmTimer = 0;

// HP multiplier for the current wave: base HP * 1.2^(wave-1).
export function waveHpScale(w = wave) {
  return Math.pow(1.2, w - 1);
}

// Begin wave n (1-based): build a shuffled spawn queue.
export function startWave(n) {
  wave = n;
  const def = WAVES[n - 1];
  queue = [];
  for (const type of ["wisp", "shroud", "maw"]) {
    for (let i = 0; i < def[type]; i++) queue.push(type);
  }
  // Shuffle so types are interleaved rather than all-wisps-then-all-shrouds.
  for (let i = queue.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [queue[i], queue[j]] = [queue[j], queue[i]];
  }
  phase = "spawning";
  spawnTimer = SPAWN_INTERVAL; // first batch spawns immediately
}

export function updateWaves(dt) {
  if (phase === "spawning") {
    spawnTimer += dt;
    while (spawnTimer >= SPAWN_INTERVAL && queue.length > 0) {
      spawnTimer -= SPAWN_INTERVAL;
      const batch =
        SPAWN_BATCH_MIN +
        Math.floor(Math.random() * (SPAWN_BATCH_MAX - SPAWN_BATCH_MIN + 1));
      for (let i = 0; i < batch && queue.length > 0; i++) {
        spawnEnemy(queue.shift(), waveHpScale());
      }
    }
    // Wave complete: nothing alive, nothing pending.
    if (queue.length === 0 && getEnemyCount() === 0) {
      if (wave >= WAVES.length) {
        phase = "done"; // final wave cleared; win condition handled elsewhere
      } else {
        phase = "calm";
        calmTimer = CALM_DURATION;
        refillBeamMeter();
      }
    }
  } else if (phase === "calm") {
    calmTimer -= dt;
    if (calmTimer <= 0) startWave(wave + 1);
  }
}

export function getWave() {
  return wave;
}

// Debug/testing hook: clear pending spawns for the current wave.
export function clearWaveQueue() {
  queue = [];
}

// Snapshot for HUD/debug/testing.
export function getWaveState() {
  return {
    wave,
    phase,
    pendingSpawns: queue.length,
    calmRemaining: phase === "calm" ? Math.max(0, calmTimer) : 0,
  };
}
