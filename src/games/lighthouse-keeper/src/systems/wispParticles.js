import wispParticleAsset from "../../assets/fog-wisp-particle.svg";
// Fog wisp particles: dropped when a Shroud or Maw dies. Each is a small
// stationary pale blue glowing circle that lasts exactly 2 seconds, then
// vanishes. While active, any enemy whose center is within 40 pixels of a
// wisp moves at 50% of its base speed (the slow does not stack).

const LIFETIME = 2; // seconds
const SLOW_RADIUS = 40; // px from wisp center
const SLOW_FACTOR = 0.5;

const wispSprite = new Image();
wispSprite.src = wispParticleAsset;

const particles = [];

// Spawn `count` stationary wisp particles at (x, y).
export function spawnWispParticles(x, y, count) {
  for (let i = 0; i < count; i++) {
    particles.push({ x, y, life: LIFETIME });
  }
}

export function updateWispParticles(dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    particles[i].life -= dt;
    if (particles[i].life <= 0) particles.splice(i, 1);
  }
}

export function drawWispParticles(ctx) {
  for (const p of particles) {
    if (wispSprite.complete && wispSprite.naturalWidth > 0) {
      ctx.drawImage(wispSprite, p.x - 16, p.y - 16, 32, 32);
    } else {
      // Fallback until the sprite loads: 10px circle with a soft glow.
      const glow = ctx.createRadialGradient(p.x, p.y, 5, p.x, p.y, 11);
      glow.addColorStop(0, "rgba(170, 187, 204, 0.5)");
      glow.addColorStop(1, "rgba(170, 187, 204, 0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = "#aabbcc";
      ctx.beginPath();
      ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }
}

// True if any active wisp is within SLOW_RADIUS of (x, y).
export function isSlowed(x, y) {
  for (const p of particles) {
    if (Math.hypot(p.x - x, p.y - y) <= SLOW_RADIUS) return true;
  }
  return false;
}

export function getWispParticleCount() {
  return particles.length;
}

export function getWispSlowFactor() {
  return SLOW_FACTOR;
}
