// The lighthouse's rotating light: a faint pair of opposing light beams that
// sweep around the beacon continuously (independent of the Space-activated
// combat beam), plus a softly pulsing lantern glow. Purely decorative.

import { LIGHTHOUSE_X, LIGHTHOUSE_Y } from "./beam.js";

const ROTATION_SPEED = (40 * Math.PI) / 180; // 40 deg/s, slow and stately
const BEAM_LENGTH = 340;
const BEAM_HALF_ANGLE = (9 * Math.PI) / 180; // 9-degree half-width per beam
const PULSE_SPEED = 2.2; // rad/s for the lantern glow pulse

let angle = 0;
let pulse = 0;

export function updateBeaconLight(dt) {
  angle = (angle + ROTATION_SPEED * dt) % (Math.PI * 2);
  pulse += PULSE_SPEED * dt;
}

export function drawBeaconLight(ctx) {
  ctx.save();

  // Two opposing faint beams sweeping around the beacon.
  for (const offset of [0, Math.PI]) {
    const start = angle + offset - BEAM_HALF_ANGLE;
    const end = angle + offset + BEAM_HALF_ANGLE;
    const grad = ctx.createRadialGradient(
      LIGHTHOUSE_X, LIGHTHOUSE_Y, 20,
      LIGHTHOUSE_X, LIGHTHOUSE_Y, BEAM_LENGTH
    );
    grad.addColorStop(0, "rgba(255, 220, 140, 0.22)");
    grad.addColorStop(1, "rgba(255, 220, 140, 0)");
    ctx.beginPath();
    ctx.moveTo(LIGHTHOUSE_X, LIGHTHOUSE_Y);
    ctx.arc(LIGHTHOUSE_X, LIGHTHOUSE_Y, BEAM_LENGTH, start, end);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();
  }

  // Softly pulsing lantern glow over the beacon center.
  const glowR = 26 + Math.sin(pulse) * 5;
  const glow = ctx.createRadialGradient(
    LIGHTHOUSE_X, LIGHTHOUSE_Y, 4,
    LIGHTHOUSE_X, LIGHTHOUSE_Y, glowR
  );
  glow.addColorStop(0, "rgba(255, 235, 180, 0.5)");
  glow.addColorStop(1, "rgba(255, 235, 180, 0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(LIGHTHOUSE_X, LIGHTHOUSE_Y, glowR, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

export function getBeaconAngle() {
  return angle;
}
