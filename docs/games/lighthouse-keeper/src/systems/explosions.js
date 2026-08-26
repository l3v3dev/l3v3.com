// Enemy death explosions: a brief amber flash, an expanding fading ring, and
// a burst of drifting ember particles. Purely visual - no gameplay effect.

const DURATION = 0.5; // seconds

const explosions = [];

// Spawn an explosion at (x, y). `radius` scales the flash/ring size to the
// enemy that died; `color` tints the ring.
export function spawnExplosion(x, y, radius = 20, color = "#f5a623") {
  const particleCount = Math.max(6, Math.round(radius / 3));
  const particles = [];
  for (let i = 0; i < particleCount; i++) {
    particles.push({
      angle: Math.random() * Math.PI * 2,
      speed: 30 + Math.random() * 70, // px/s
      size: 1.5 + Math.random() * 2.5,
      life: 0.6 + Math.random() * 0.4, // fraction of DURATION
    });
  }
  explosions.push({ x, y, radius, color, particles, t: 0 });
}

export function updateExplosions(dt) {
  for (let i = explosions.length - 1; i >= 0; i--) {
    explosions[i].t += dt;
    if (explosions[i].t >= DURATION) explosions.splice(i, 1);
  }
}

export function drawExplosions(ctx) {
  for (const ex of explosions) {
    const t = ex.t / DURATION; // 0 -> 1
    ctx.save();
    ctx.globalCompositeOperation = "lighter";

    // Central flash: bright at first, fades fast.
    const flashAlpha = Math.max(0, 1 - t * 2.5);
    if (flashAlpha > 0) {
      const r = ex.radius * (0.6 + t * 0.8);
      const g = ctx.createRadialGradient(ex.x, ex.y, 0, ex.x, ex.y, r);
      g.addColorStop(0, `rgba(255, 243, 214, ${0.9 * flashAlpha})`);
      g.addColorStop(0.4, `rgba(245, 166, 35, ${0.5 * flashAlpha})`);
      g.addColorStop(1, "rgba(245, 166, 35, 0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(ex.x, ex.y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Expanding ring.
    const ringR = ex.radius * (0.4 + t * 1.6);
    ctx.globalAlpha = Math.max(0, 0.7 * (1 - t));
    ctx.strokeStyle = ex.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(ex.x, ex.y, ringR, 0, Math.PI * 2);
    ctx.stroke();

    // Drifting embers.
    for (const p of ex.particles) {
      const pt = Math.min(1, t / p.life);
      if (pt >= 1) continue;
      const dist = p.speed * ex.t;
      const px = ex.x + Math.cos(p.angle) * dist;
      const py = ex.y + Math.sin(p.angle) * dist;
      ctx.globalAlpha = (1 - pt) * 0.9;
      ctx.fillStyle = "#ffd27a";
      ctx.beginPath();
      ctx.arc(px, py, p.size * (1 - pt * 0.5), 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

export function getExplosionCount() {
  return explosions.length;
}
