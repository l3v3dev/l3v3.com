// A lantern bolt: the lantern-bolt sprite (amber core + glow) traveling in a
// straight line at 500 px/s, with a fading motion trail behind it and a
// subtle glow flicker while it flies. Despawned after 1.5 seconds.

const RADIUS = 3; // 6px diameter (collision size)
const SPEED = 500; // px/s
const LIFETIME = 1.5; // seconds
const TRAIL_LENGTH = 22; // px of trail behind the bolt
const TRAIL_MAX_POINTS = 12;

// Shared sprite - loaded once for all bolts.
const boltSprite = new Image();
boltSprite.src = "assets/lantern-bolt.svg";

export class Bolt {
  constructor(x, y, angle) {
    this.x = x;
    this.y = y;
    this.vx = Math.cos(angle) * SPEED;
    this.vy = Math.sin(angle) * SPEED;
    this.angle = angle;
    this.radius = RADIUS;
    this.life = LIFETIME;
    this.age = 0;
    this.flickerPhase = Math.random() * Math.PI * 2;
    this.trail = [{ x, y }];
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.life -= dt;
    this.age += dt;

    // Record the trail, capped by point count and total length.
    this.trail.push({ x: this.x, y: this.y });
    while (this.trail.length > TRAIL_MAX_POINTS) this.trail.shift();
    let len = 0;
    for (let i = this.trail.length - 1; i > 0; i--) {
      len += Math.hypot(this.trail[i].x - this.trail[i - 1].x, this.trail[i].y - this.trail[i - 1].y);
      if (len >= TRAIL_LENGTH) {
        this.trail.splice(0, i);
        break;
      }
    }
  }

  get expired() {
    return this.life <= 0;
  }

  draw(ctx) {
    // Fading motion trail: a tapered amber streak from oldest to newest point.
    if (this.trail.length > 1) {
      ctx.save();
      ctx.lineCap = "round";
      for (let i = 1; i < this.trail.length; i++) {
        const t = i / (this.trail.length - 1); // 0 = oldest, 1 = newest
        ctx.beginPath();
        ctx.moveTo(this.trail[i - 1].x, this.trail[i - 1].y);
        ctx.lineTo(this.trail[i].x, this.trail[i].y);
        ctx.strokeStyle = `rgba(255, 215, 0, ${0.45 * t})`;
        ctx.lineWidth = 1 + 3 * t;
        ctx.stroke();
      }
      ctx.restore();
    }

    // Subtle glow flicker: the sprite's apparent size pulses slightly.
    const flicker = 1 + 0.12 * Math.sin(this.age * 28 + this.flickerPhase);
    const size = 16 * flicker;

    if (boltSprite.complete && boltSprite.naturalWidth > 0) {
      ctx.drawImage(boltSprite, this.x - size / 2, this.y - size / 2, size, size);
    } else {
      // Fallback until the sprite loads: amber core with a soft glow.
      const glow = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, 7 * flicker);
      glow.addColorStop(0, "rgba(255, 215, 0, 0.9)");
      glow.addColorStop(0.43, "rgba(255, 215, 0, 0.55)");
      glow.addColorStop(1, "rgba(255, 215, 0, 0)");
      ctx.beginPath();
      ctx.arc(this.x, this.y, 7 * flicker, 0, Math.PI * 2);
      ctx.fillStyle = glow;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = "#ffd700";
      ctx.fill();
    }
  }
}
