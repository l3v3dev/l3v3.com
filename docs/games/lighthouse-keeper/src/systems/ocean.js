// Animated ocean around the rock platform: two wavy water rings whose radii
// breathe with a sine wave, plus drifting foam flecks that orbit the shore.
// Purely decorative - drawn right after the background, before the beam.

const CX = 400;
const CY = 300;
const BASE_RADIUS = 292; // just outside the rock platform edge

const WAVE_SPEED = 1.2; // rad/s for the ring breathing
const FOAM_SPEED = 0.15; // rad/s for foam drift around the shore

const foam = [];
for (let i = 0; i < 26; i++) {
  foam.push({
    angle: Math.random() * Math.PI * 2,
    offset: 4 + Math.random() * 26, // px outside the rock edge
    size: 1 + Math.random() * 2.2,
    speed: 0.5 + Math.random(), // relative drift multiplier
    phase: Math.random() * Math.PI * 2,
  });
}

let phase = 0;

export function updateOcean(dt) {
  phase += WAVE_SPEED * dt;
}

export function drawOcean(ctx) {
  ctx.save();

  // Two wavy rings: outer faint, inner slightly brighter.
  const rings = [
    { r: BASE_RADIUS + 14, amp: 5, alpha: 0.16, color: "#3d4a63", speed: 1 },
    { r: BASE_RADIUS + 4, amp: 3.5, alpha: 0.28, color: "#5a6a8a", speed: 1.4 },
  ];

  for (const ring of rings) {
    ctx.beginPath();
    const steps = 72;
    for (let i = 0; i <= steps; i++) {
      const a = (i / steps) * Math.PI * 2;
      const wobble =
        Math.sin(a * 5 + phase * ring.speed) * ring.amp +
        Math.sin(a * 3 - phase * ring.speed * 0.7) * ring.amp * 0.6;
      const r = ring.r + wobble;
      const x = CX + Math.cos(a) * r;
      const y = CY + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.globalAlpha = ring.alpha;
    ctx.strokeStyle = ring.color;
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  // Drifting foam flecks just outside the shore.
  ctx.fillStyle = "#8fa3c4";
  for (const f of foam) {
    const a = f.angle + phase * FOAM_SPEED * f.speed;
    const r = BASE_RADIUS + f.offset + Math.sin(phase * 0.8 + f.phase) * 3;
    const x = CX + Math.cos(a) * r;
    const y = CY + Math.sin(a) * r;
    ctx.globalAlpha = 0.25 + 0.2 * Math.sin(phase + f.phase);
    ctx.beginPath();
    ctx.arc(x, y, f.size, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

export function getOceanPhase() {
  return phase;
}
