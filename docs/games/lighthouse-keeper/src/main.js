// Entry point - boots the game and owns the top-level loop. Gameplay lives in
// src/entities/ and src/systems/.

import { Player } from "./entities/Player.js";
import { updateBolts, drawBolts, getBoltCount } from "./systems/bolts.js";
import {
  updateEnemies,
  drawEnemies,
  getEnemyCount,
  getEnemyInfo,
  getEnemies,
} from "./systems/enemies.js";
import {
  startWave,
  updateWaves,
  getWave,
  getWaveState,
  waveHpScale,
  clearWaveQueue,
} from "./systems/waves.js";
import {
  updateBeam,
  drawLighthouse,
  drawBeam,
  getBeamMeter,
  isBeamActive,
} from "./systems/beam.js";
import {
  updateWispParticles,
  drawWispParticles,
  getWispParticleCount,
} from "./systems/wispParticles.js";
import {
  updateLighthouse,
  getLighthouseHP,
  setLighthouseHP,
  isLighthouseDestroyed,
  drawLighthousePulse,
} from "./systems/lighthouse.js";
import { drawHUD } from "./systems/hud.js";
import {
  updateShootEffects,
  drawShootEffects,
  getMuzzleFlashCount,
  getSparkCount,
} from "./systems/shootEffects.js";
import { updateExplosions, drawExplosions, getExplosionCount } from "./systems/explosions.js";
import { updateOcean, drawOcean, getOceanPhase } from "./systems/ocean.js";
import { updateBeaconLight, drawBeaconLight, getBeaconAngle } from "./systems/beaconLight.js";

const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");

const background = new Image();
background.src = "assets/bg-rock.svg";

const player = new Player(400, 450);

startWave(1);

window.gameState = {
  started: true,
  playerX: player.x,
  playerY: player.y,
  enemyCount: getEnemyCount(),
  beamMeter: getBeamMeter(),
  beamActive: isBeamActive(),
  wave: getWave(),
  lighthouseHP: getLighthouseHP(),
  wispParticleCount: getWispParticleCount(),
  explosionCount: getExplosionCount(),
  muzzleFlashCount: getMuzzleFlashCount(),
  sparkCount: getSparkCount(),
  oceanPhase: getOceanPhase(),
  beaconAngle: getBeaconAngle(),
};

let lastTime = performance.now();

function drawScene() {
  if (background.complete && background.naturalWidth > 0) {
    ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
  } else {
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  drawOcean(ctx);
  drawBeam(ctx);
  drawLighthouse(ctx);
  drawBeaconLight(ctx);
  drawLighthousePulse(ctx);
  player.draw(ctx);
  drawEnemies(ctx);
  drawWispParticles(ctx);
  drawExplosions(ctx);
  drawBolts(ctx, player);
  drawShootEffects(ctx);
  drawHUD(ctx, {
    lighthouseHP: getLighthouseHP(),
    beamMeter: getBeamMeter(),
    wave: getWave(),
  });
}

// Stop the loop and render the final frame with the end message centered.
function endGame(text, color) {
  window.gameState.gameOver = true;
  drawScene();
  ctx.save();
  ctx.font = "bold 48px Georgia, serif";
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);
  ctx.restore();
}

function loop(now) {
  // Clamp dt so a background tab doesn't cause a huge jump on return.
  const dt = Math.min((now - lastTime) / 1000, 0.1);
  lastTime = now;

  player.update(dt, { width: canvas.width, height: canvas.height });
  updateBolts(dt, player);
  updateEnemies(dt); // moves enemies, resolves bolt hits, removes the dead
  updateWispParticles(dt); // age out fog wisp drops
  updateWaves(dt); // wave-complete check must see the post-removal enemy count
  updateExplosions(dt); // age out death explosions
  updateShootEffects(dt); // age out muzzle flashes and impact sparks
  updateBeam(dt, getEnemies());
  updateLighthouse(dt, getEnemies()); // damage + destroy enemies at the beacon
  updateOcean(dt); // decorative animated water around the platform
  updateBeaconLight(dt); // decorative rotating light + pulsing lantern glow

  drawScene();

  window.gameState.playerX = player.x;
  window.gameState.playerY = player.y;
  window.gameState.boltCount = getBoltCount();
  window.gameState.enemyCount = getEnemyCount();
  window.gameState.enemyInfo = getEnemyInfo();
  window.gameState.beamMeter = getBeamMeter();
  window.gameState.beamActive = isBeamActive();
  window.gameState.wave = getWave();
  window.gameState.waveState = getWaveState();
  window.gameState.waveHpScale = waveHpScale();
  window.gameState.lighthouseHP = getLighthouseHP();
  window.gameState.wispParticleCount = getWispParticleCount();
  window.gameState.explosionCount = getExplosionCount();
  window.gameState.muzzleFlashCount = getMuzzleFlashCount();
  window.gameState.sparkCount = getSparkCount();
  window.gameState.oceanPhase = getOceanPhase();
  window.gameState.beaconAngle = getBeaconAngle();

  // Loss: the lighthouse has been destroyed.
  if (isLighthouseDestroyed()) {
    endGame("The Light Goes Out", "#ffffff");
    return;
  }

  // Win: wave 5 cleared with no enemies alive and no pending spawns.
  const ws = getWaveState();
  if (
    ws.wave >= 5 &&
    ws.phase === "done" &&
    getEnemyCount() === 0 &&
    ws.pendingSpawns === 0
  ) {
    endGame("The Light Holds", "#f5a623");
    return;
  }

  requestAnimationFrame(loop);
}

// Debug/testing hooks (not part of normal gameplay).
window.__debug = {
  startWave,
  enemies: getEnemies(),
  setLighthouseHP,
  clearWaveQueue,
};

requestAnimationFrame(loop);
