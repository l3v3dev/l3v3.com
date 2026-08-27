// Top-left HUD overlay: lighthouse HP bar, beam meter bar, and wave label.
// All values are read fresh each frame so the HUD always reflects current state.

const BG = "#1a1a2e";
const BORDER = "#3a3a3a";
const HP_FILL = "#f5a623";
const BEAM_FILL = "#66ccff";

const MARGIN = 10;
const GAP = 8;

const HOME_BUTTON = {  x: MARGIN,
  y: MARGIN, w: 28, h: 28 };
const CONTROLS_LABEL = {
 x: HOME_BUTTON.x + HOME_BUTTON.w + GAP, 
  y: MARGIN,
  w: 28,
  h: 28,
};
const REFRESH_BUTTON = {
  x: CONTROLS_LABEL.x + CONTROLS_LABEL.w + GAP,
  y: MARGIN,
  w: 28,
  h: 28,
};

const HP_BAR = { x: MARGIN, y: CONTROLS_LABEL.y + CONTROLS_LABEL.h + GAP, w: 200, h: 16 };
const BEAM_BAR = { x: MARGIN, y: HP_BAR.y + HP_BAR.h + GAP, w: 120, h: 12 };
const WAVE_LABEL = {
  x: MARGIN,
  y: BEAM_BAR.y + BEAM_BAR.h + GAP,
  w: 100,
  h: 28,
};

export function isControlsLabelHit(x, y) {
  return (
    x >= CONTROLS_LABEL.x &&
    x <= CONTROLS_LABEL.x + CONTROLS_LABEL.w &&
    y >= CONTROLS_LABEL.y &&
    y <= CONTROLS_LABEL.y + CONTROLS_LABEL.h
  );
}

function isHit(rect, x, y) {
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}

export function isHomeButtonHit(x, y) {
  return isHit(HOME_BUTTON, x, y);
}

export function isRefreshButtonHit(x, y) {
  return isHit(REFRESH_BUTTON, x, y);
}

function drawBar(ctx, bar, value, max, fill) {
  const ratio = Math.max(0, Math.min(1, value / max));
  ctx.fillStyle = BG;
  ctx.fillRect(bar.x, bar.y, bar.w, bar.h);
  ctx.fillStyle = fill;
  ctx.fillRect(bar.x, bar.y, bar.w * ratio, bar.h);
  ctx.strokeStyle = BORDER;
  ctx.lineWidth = 1;
  ctx.strokeRect(bar.x + 0.5, bar.y + 0.5, bar.w - 1, bar.h - 1);
}

function drawRoundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function drawHUD(ctx, { lighthouseHP, beamMeter, wave }) {
  drawBar(ctx, HP_BAR, lighthouseHP, 100, HP_FILL);
  drawBar(ctx, BEAM_BAR, beamMeter, 100, BEAM_FILL);

  const { x, y, w, h } = WAVE_LABEL;
  drawRoundedRect(ctx, x, y, w, h, 6);
  ctx.fillStyle = BG;
  ctx.fill();
  ctx.strokeStyle = BORDER;
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.save();
  ctx.font = "14px Georgia, serif";
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(`Wave ${wave}`, x + w / 2, y + h / 2);
  ctx.restore();

  const ctrl = CONTROLS_LABEL;
  drawRoundedRect(ctx, ctrl.x, ctrl.y, ctrl.w, ctrl.h, 6);
  ctx.fillStyle = BG;
  ctx.fill();
  ctx.strokeStyle = BORDER;
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.save();
  ctx.font = "14px Georgia, serif";
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("🎮", ctrl.x + ctrl.w / 2, ctrl.y + ctrl.h / 2);
  ctx.restore();

  for (const button of [HOME_BUTTON, REFRESH_BUTTON]) {
    drawRoundedRect(ctx, button.x, button.y, button.w, button.h, 6);
    ctx.fillStyle = BG;
    ctx.fill();
    ctx.strokeStyle = BORDER;
    ctx.stroke();
  }

  ctx.save();
  ctx.font = "18px Georgia, serif";
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("⌂", HOME_BUTTON.x + HOME_BUTTON.w / 2, HOME_BUTTON.y + HOME_BUTTON.h / 2);
  ctx.fillText("↻", REFRESH_BUTTON.x + REFRESH_BUTTON.w / 2, REFRESH_BUTTON.y + REFRESH_BUTTON.h / 2);
  ctx.restore();
}
