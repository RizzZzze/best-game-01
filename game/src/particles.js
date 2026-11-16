// particles.js — gelembung kauldron + splash sajian.
// Visual murni: semua keacakan memakai Math.random agar tidak menggeser
// aliran RNG permainan (state.rng) yang menentukan resep/antrean.

const MAX_PARTICLES = 120;

export class ParticleSystem {
  constructor() {
    this.particles = [];
  }

  spawnBubble(x, y, color) {
    if (this.particles.length >= MAX_PARTICLES) return;
    this.particles.push({
      kind: 'bubble',
      x: x + (Math.random() - 0.5) * 8,
      y,
      vx: 0,
      vy: -28 - Math.random() * 22,
      wobblePhase: Math.random() * Math.PI * 2,
      life: 1.1 + Math.random() * 0.5,
      maxLife: 1.6,
      radius: 3 + Math.random() * 5,
      color,
    });
  }

  spawnSplash(x, y, colors) {
    const palette = colors && colors.length > 0 ? colors : ['#e8a558'];
    for (let i = 0; i < 14; i += 1) {
      if (this.particles.length >= MAX_PARTICLES) return;
      const angle = Math.random() * Math.PI * 2;
      const speed = 60 + Math.random() * 110;
      this.particles.push({
        kind: 'splash',
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 60,
        wobblePhase: 0,
        life: 0.55 + Math.random() * 0.3,
        maxLife: 0.85,
        radius: 2.5 + Math.random() * 3.5,
        color: palette[i % palette.length],
      });
    }
  }

  update(dt) {
    const alive = [];
    for (const p of this.particles) {
      p.life -= dt;
      if (p.life <= 0) continue;
      if (p.kind === 'bubble') {
        p.wobblePhase += dt * 4;
        p.x += Math.sin(p.wobblePhase) * 14 * dt;
        p.y += p.vy * dt;
      } else {
        p.vy += 260 * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
      }
      alive.push(p);
    }
    this.particles = alive;
  }

  draw(ctx) {
    for (const p of this.particles) {
      const alpha = Math.max(0, Math.min(1, p.life / (p.maxLife * 0.5)));
      ctx.globalAlpha = alpha;
      if (p.kind === 'bubble') {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.beginPath();
        ctx.arc(p.x - p.radius * 0.3, p.y - p.radius * 0.3, p.radius * 0.22, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }

  clear() {
    this.particles.length = 0;
  }
}
