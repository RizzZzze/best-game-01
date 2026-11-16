// render_entities.js — pelanggan dan kauldron: siluet berkerudung,
// potret per tipe (Guest/Purist/Critic), cairan kauldron, halo, gelembung
// warna, dan uap. Semua gerakan fungsi murni dari waktu. (Pecahan dari
// render.js, Fase 1 v3: pindah verbatim.)

import { brightenRgb, parseRgb, shadeRgb } from './render_scene.js';
import { starPath } from './render_cards.js';

export const SILHOUETTE_ACCENTS = ['#c47b3a', '#7a9a5b', '#5b8a9a'];

// Siluet pelanggan berkerudung di dalam lingkaran radius r.
export function drawSilhouette(ctx, cx, cy, r, accent) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = '#241610';
  ctx.beginPath();
  ctx.moveTo(cx - r, cy + r);
  ctx.quadraticCurveTo(cx - r * 0.9, cy + r * 0.15, cx, cy + r * 0.15);
  ctx.quadraticCurveTo(cx + r * 0.9, cy + r * 0.15, cx + r, cy + r);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#31200f';
  ctx.beginPath();
  ctx.arc(cx, cy - r * 0.28, r * 0.52, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#0f0a06';
  ctx.beginPath();
  ctx.arc(cx, cy - r * 0.22, r * 0.38, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = accent;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(cx, cy - r * 0.22, r * 0.46, Math.PI * 0.25, Math.PI * 0.75);
  ctx.stroke();
  ctx.restore();
  ctx.strokeStyle = 'rgba(242,230,207,0.25)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy, r - 0.75, 0, Math.PI * 2);
  ctx.stroke();
}

// Cairan kauldron: permukaan bergelombang + gradien warna campuran.
export function drawCauldronLiquid(ctx, cx, cy, radius, mixColor, time) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.clip();
  if (!mixColor) {
    ctx.fillStyle = '#0f0a06';
    ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
    ctx.restore();
    return;
  }
  const g = ctx.createLinearGradient(0, cy - radius, 0, cy + radius);
  g.addColorStop(0, brightenRgb(mixColor, 1.3));
  g.addColorStop(0.35, mixColor);
  g.addColorStop(1, shadeRgb(mixColor, 0.55));
  ctx.fillStyle = g;
  const surfY = cy - radius * 0.18;
  const wave = (px) => surfY + Math.sin(px * 0.09 + time * 2.2) * 4;
  ctx.beginPath();
  ctx.moveTo(cx - radius, cy + radius);
  ctx.lineTo(cx - radius, wave(-radius));
  for (let px = -radius; px <= radius; px += 8) ctx.lineTo(cx + px, wave(px));
  ctx.lineTo(cx + radius, cy + radius);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let px = -radius; px <= radius; px += 8) {
    if (px === -radius) ctx.moveTo(cx + px, wave(px));
    else ctx.lineTo(cx + px, wave(px));
  }
  ctx.stroke();
  ctx.restore();
}

// Halo menyala di sekeliling kauldron saat terisi.
export function drawCauldronHalo(ctx, cx, cy, radius, mixColor) {
  if (!mixColor) return;
  ctx.save();
  const glow = ctx.createRadialGradient(cx, cy, radius * 0.6, cx, cy, radius + 46);
  const [r, g, b] = parseRgb(mixColor);
  glow.addColorStop(0, `rgba(${r},${g},${b},0.20)`);
  glow.addColorStop(1, `rgba(${r},${g},${b},0)`);
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(cx, cy, radius + 46, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 0.28;
  ctx.strokeStyle = mixColor;
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.arc(cx, cy, radius + 6, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 0.14;
  ctx.lineWidth = 18;
  ctx.beginPath();
  ctx.arc(cx, cy, radius + 12, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 0.07;
  ctx.lineWidth = 26;
  ctx.beginPath();
  ctx.arc(cx, cy, radius + 22, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

// Gelembung warna per elemen di dalam cairan: satu orb per slot terisi,
// sehingga campuran proporsional terlihat langsung (bukan hanya rata-rata).
export function drawCauldronBlobs(ctx, cx, cy, radius, elements, time) {
  if (!elements || elements.length === 0) return;
  const n = elements.length;
  const orbR = radius * (n <= 2 ? 0.34 : n === 3 ? 0.28 : n === 4 ? 0.24 : 0.21);
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius - 4, 0, Math.PI * 2);
  ctx.clip();
  elements.forEach((el, i) => {
    const angle = -Math.PI / 2 + (i * Math.PI * 2) / n + Math.sin(time * 0.8 + i) * 0.15;
    const dist = radius * 0.38;
    const bx = cx + Math.cos(angle) * dist;
    const by = cy + Math.sin(angle) * dist + Math.sin(time * 1.3 + i * 2) * 4;
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = el.color;
    ctx.beginPath();
    ctx.arc(bx, by, orbR, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.beginPath();
    ctx.arc(bx - orbR * 0.3, by - orbR * 0.3, orbR * 0.22, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
}

// Uap mengepul di atas kauldron: 3 sulur bezier yang bergoyang pelan.
// Fungsi murni dari waktu — tanpa RNG.
export function drawSteam(ctx, cx, cy, radius, time) {
  ctx.save();
  ctx.lineCap = 'round';
  for (let i = 0; i < 3; i += 1) {
    const x0 = cx + (i - 1) * 26;
    const sway = Math.sin(time * 1.1 + i * 2.1) * 8;
    const sway2 = Math.sin(time * 0.9 + i * 1.3 + 1) * 12;
    ctx.strokeStyle = `rgba(242,230,207,${0.1 + 0.05 * Math.sin(time + i)})`;
    ctx.lineWidth = 5 - i * 0.8;
    ctx.beginPath();
    ctx.moveTo(x0, cy - radius - 4);
    ctx.bezierCurveTo(
      x0 + sway, cy - radius - 26,
      x0 + sway2, cy - radius - 44,
      x0 + sway * 0.5, cy - radius - 66,
    );
    ctx.stroke();
  }
  ctx.restore();
}

// Potret pelanggan per tipe: Guest = siluet berkerudung dasar; Purist =
// halo + trim putih + sigil; Critic = bahu merah + monokel + lencana.
// drawSilhouette tidak diubah; varian digambar sebagai overlay.
export function drawCustomerPortrait(ctx, customer, cx, cy, r, accent) {
  drawSilhouette(ctx, cx, cy, r, accent);
  if (customer.purist) {
    ctx.strokeStyle = 'rgba(242,230,207,0.85)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(cx, cy - r * 0.92, r * 0.3, r * 0.12, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = '#f2e6cf';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy - r * 0.22, r * 0.46, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();
    ctx.fillStyle = 'rgba(242,230,207,0.9)';
    ctx.save();
    ctx.translate(cx, cy + r * 0.55);
    ctx.rotate(Math.PI / 4);
    ctx.fillRect(-r * 0.1, -r * 0.1, r * 0.2, r * 0.2);
    ctx.restore();
  } else if (customer.critic) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = 'rgba(58,20,20,0.85)';
    ctx.fillRect(cx - r, cy + r * 0.3, r * 2, r);
    ctx.restore();
    ctx.strokeStyle = '#e5484d';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy - r * 0.22, r * 0.52, Math.PI * 0.25, Math.PI * 0.75);
    ctx.stroke();
    ctx.strokeStyle = '#f2b234';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx + r * 0.16, cy - r * 0.22, r * 0.2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(242,178,52,0.6)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx + r * 0.32, cy - r * 0.08);
    ctx.lineTo(cx + r * 0.5, cy + r * 0.3);
    ctx.stroke();
    starPath(ctx, cx - r * 0.45, cy + r * 0.45, r * 0.16);
    ctx.fillStyle = '#f2b234';
    ctx.fill();
  }
}
