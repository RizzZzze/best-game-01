// particles.js — gelembung kauldron + splash sajian + teks mengambang +
// flare kombo + partikel ambient tema.
// Visual murni: semua keacakan memakai RNG visual (state.visualRng) yang
// dilewatkan pemanggil agar tidak menggeser aliran RNG permainan
// (state.rng) yang menentukan resep/antrean, dan agar capture dengan seed
// sama deterministik. Math.random hanya default bila pemanggil tidak
// menyediakan RNG (penggunaan mandiri di luar state).

const MAX_PARTICLES = 120;

export class ParticleSystem {
  constructor() {
    this.particles = [];
  }

  spawnBubble(x, y, color, rng = Math.random) {
    if (this.particles.length >= MAX_PARTICLES) return;
    this.particles.push({
      kind: 'bubble',
      x: x + (rng() - 0.5) * 8,
      y,
      vx: 0,
      vy: -28 - rng() * 22,
      wobblePhase: rng() * Math.PI * 2,
      life: 1.1 + rng() * 0.5,
      maxLife: 1.6,
      radius: 4 + rng() * 6,
      color,
    });
  }

  spawnSplash(x, y, colors, rng = Math.random, count = 14) {
    const palette = colors && colors.length > 0 ? colors : ['#e8a558'];
    for (let i = 0; i < count; i += 1) {
      if (this.particles.length >= MAX_PARTICLES) return;
      const angle = rng() * Math.PI * 2;
      const speed = 60 + rng() * 110;
      this.particles.push({
        kind: 'splash',
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 60,
        wobblePhase: 0,
        life: 0.55 + rng() * 0.3,
        maxLife: 0.85,
        radius: 2.5 + rng() * 3.5,
        color: palette[i % palette.length],
      });
    }
  }

  // Teks mengambang (mis. "+12 coins") yang naik lalu memudar. Tanpa RNG.
  spawnFloater(text, x, y, color) {
    if (this.particles.length >= MAX_PARTICLES) return;
    this.particles.push({
      kind: 'floater',
      text,
      x,
      y,
      vx: 0,
      vy: -34,
      wobblePhase: 0,
      life: 1.2,
      maxLife: 1.2,
      radius: 0,
      color,
    });
  }

  // Flare kombo: cincin mengembang + 8 sinar. Tanpa RNG.
  spawnFlare(x, y, color, maxRadius = 130) {
    if (this.particles.length >= MAX_PARTICLES) return;
    this.particles.push({
      kind: 'flare',
      x,
      y,
      vx: 0,
      vy: 0,
      wobblePhase: 0,
      life: 0.5,
      maxLife: 0.5,
      radius: 20,
      maxRadius,
      color,
    });
  }

  // Partikel ambient tema: 'rain' (jatuh cepat), 'ember' (naik, berkelip),
  // 'mote' (melayang lambat), 'snow' (jatuh pelan, bergoyang), 'firefly'
  // (kunang-kunang: mengembara pelan, berdenyut). Posisi awal dipilih pemanggil.
  spawnAmbient(kind, x, y, rng = Math.random, color = '#e8c890') {
    if (this.particles.length >= MAX_PARTICLES) return;
    const base = {
      kind, x, y, wobblePhase: rng() * Math.PI * 2, color,
    };
    if (kind === 'rain') {
      this.particles.push({
        ...base,
        vx: -30 - rng() * 30,
        vy: 380 + rng() * 140,
        life: 2,
        maxLife: 2,
        radius: 1.5,
      });
    } else if (kind === 'ember') {
      this.particles.push({
        ...base,
        vx: (rng() - 0.5) * 16,
        vy: -30 - rng() * 30,
        life: 2.5 + rng() * 1.5,
        maxLife: 4,
        radius: 1.5 + rng() * 2,
      });
    } else if (kind === 'snow') {
      this.particles.push({
        ...base,
        vx: (rng() - 0.5) * 30,
        vy: 40 + rng() * 30,
        life: 6 + rng() * 3,
        maxLife: 9,
        radius: 1.5 + rng(),
      });
    } else if (kind === 'firefly') {
      this.particles.push({
        ...base,
        vx: (rng() - 0.5) * 24,
        vy: (rng() - 0.5) * 18,
        life: 4 + rng() * 3,
        maxLife: 7,
        radius: 2 + rng(),
        color: '#d8f28a',
      });
    } else {
      this.particles.push({
        ...base,
        vx: (rng() - 0.5) * 20,
        vy: -8 - rng() * 8,
        life: 4 + rng() * 2,
        maxLife: 6,
        radius: 1.5 + rng() * 2,
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
      } else if (p.kind === 'flare') {
        const progress = 1 - p.life / p.maxLife;
        p.radius = 20 + (p.maxRadius - 20) * (1 - (1 - progress) * (1 - progress));
      } else if (p.kind === 'floater') {
        p.y += p.vy * dt;
      } else if (p.kind === 'rain') {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.y > 724) continue;
      } else if (p.kind === 'ember' || p.kind === 'mote') {
        p.wobblePhase += dt * 2;
        p.x += (p.vx + Math.sin(p.wobblePhase) * 10) * dt;
        p.y += p.vy * dt;
        if (p.y < -8) continue;
      } else if (p.kind === 'snow') {
        p.wobblePhase += dt * 1.5;
        p.x += (p.vx + Math.sin(p.wobblePhase) * 16) * dt;
        p.y += p.vy * dt;
        if (p.y > 724) continue;
      } else if (p.kind === 'firefly') {
        p.wobblePhase += dt * 1.2;
        p.x += (p.vx + Math.sin(p.wobblePhase) * 14) * dt;
        p.y += (p.vy + Math.cos(p.wobblePhase * 0.8) * 10) * dt;
        if (p.x < -8 || p.x > 1288 || p.y < -8 || p.y > 728) continue;
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
        ctx.fillStyle = p.color;
        ctx.globalAlpha = alpha * 0.18;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.beginPath();
        ctx.arc(p.x - p.radius * 0.3, p.y - p.radius * 0.3, p.radius * 0.22, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.kind === 'flare') {
        const progress = 1 - p.life / p.maxLife;
        ctx.globalAlpha = (1 - progress) * 0.9;
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 3 - progress * 2;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = (1 - progress) * 0.55;
        ctx.lineWidth = 2;
        for (let i = 0; i < 8; i += 1) {
          const a = (i * Math.PI) / 4 + progress * 0.5;
          ctx.beginPath();
          ctx.moveTo(p.x + Math.cos(a) * p.radius * 0.7, p.y + Math.sin(a) * p.radius * 0.7);
          ctx.lineTo(p.x + Math.cos(a) * p.radius, p.y + Math.sin(a) * p.radius);
          ctx.stroke();
        }
      } else if (p.kind === 'floater') {
        ctx.save();
        ctx.globalAlpha = Math.min(1, (p.life / p.maxLife) * 2);
        ctx.font = '24px Georgia, serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'alphabetic';
        ctx.fillStyle = p.color;
        ctx.fillText(p.text, p.x, p.y);
        ctx.restore();
        ctx.globalAlpha = 1;
      } else if (p.kind === 'rain') {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.vx * 0.03, p.y - p.vy * 0.03);
        ctx.stroke();
      } else if (p.kind === 'ember') {
        const flicker = 0.6 + 0.4 * Math.sin(p.wobblePhase * 3);
        ctx.globalAlpha = alpha * 0.25 * flicker;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * 2.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = alpha * flicker;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.kind === 'mote') {
        ctx.globalAlpha = alpha * 0.35;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.kind === 'snow') {
        ctx.globalAlpha = alpha * 0.85;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.kind === 'firefly') {
        const pulse = 0.5 + 0.5 * Math.sin(p.wobblePhase * 2);
        ctx.globalAlpha = alpha * 0.2 * pulse;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = alpha * (0.35 + 0.65 * pulse);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
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
