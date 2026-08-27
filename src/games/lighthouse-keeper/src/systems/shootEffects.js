// Shooting feedback effects: a brief muzzle flash at the player on each shot
// and a small spark burst where a bolt hits an enemy. Purely visual.

const MUZZLE_DURATION = 0.08; // seconds
const SPARK_DURATION = 0.25; // seconds

const muzzleFlashes = [];
const sparks = [];

// Spawn a muzzle flash at (x, y) pointing along `angle`.
export function spawnMuzzleFlash(x, y, angle) {
  muzzleFlashes.push({ x, y, angle, t: 0 });
}

// Spawn a spark burst at (x, y): 5-6 short-lived amber particles.
export function spawnImpactSparks(x, y) {
  const count = 5 + Math.floor(Math.random() * 2);
  const particles = [];
  for (let i = 0; i < count; i++) {
    particles.push({
      angle: Math.random() * Math.PI * 2,
      speed: 60 + Math.random() * 120, // px/s
      size: 1 + Math.random() * 1.5,
    });
  }
  sparks.push({ x, y, particles, t: 0 });
}

export function updateShootEffects(dt) {
  for (let i = muzzleFlashes.length - 1; i >= 0; i--) {
    muzzleFlashes[i].t += dt;
    if (muzzleFlashes[i].t >= MUZZLE_DURATION) muzzleFlashes.splice(i, 1);
  }
  for (let i = sparks.length - 1; i >= 0; i--) {
    sparks[i].t += dt;
    if (sparks[i].t >= SPARK_DURATION) sparks.splice(i, 1);
  }
}

export function drawShootEffects(ctx) {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";

  // Muzzle flashes: a radial flash plus a short streak in the firing direction.
  for (const f of muzzleFlashes) {
    const t = f.t / MUZZLE_DURATION; // 0 -> 1
    const alpha = 1 - t;
    const r = 10 * (0.6 + t * 0.8);
    const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, r);
    g.addColorStop(0, `rgba(255, 243, 214, ${0.9 * alpha})`);
    g.addColorStop(0.5, `rgba(255, 215, 0, ${0.5 * alpha})`);
    g.addColorStop(1, "rgba(255, 215, 0, 0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(f.x, f.y, r, 0, Math.PI * 2);
    ctx.fill();

    // Short streak along the firing direction.
    const streakLen = 14 * (1 - t * 0.5);
    ctx.strokeStyle = `rgba(255, 215, 0, ${0.7 * alpha})`;
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(f.x, f.y);
    ctx.lineTo(f.x + Math.cos(f.angle) * streakLen, f.y + Math.sin(f.angle) * streakLen);
    ctx.stroke();
  }

  // Impact sparks: small amber particles drifting outward and fading.
  for (const s of sparks) {
    const t = s.t / SPARK_DURATION; // 0 -> 1
    for (const p of s.particles) {
      const dist = p.speed * s.t;
      const px = s.x + Math.cos(p.angle) * dist;
      const py = s.y + Math.sin(p.angle) * dist;
      ctx.globalAlpha = (1 - t) * 0.9;
      ctx.fillStyle = "#ffd27a";
      ctx.beginPath();
      ctx.arc(px, py, p.size * (1 - t * 0.5), 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}

export function getMuzzleFlashCount() {
  return muzzleFlashes.length;
}

export function getSparkCount() {
  return sparks.length;
}
