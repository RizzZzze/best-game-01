// render.js — primitif canvas + palet apothecary + seni prosedural.
// Palet: latar coklat sangat gelap, panel kayu gelap, teks krim, aksen
// tembaga. Semua gambar prosedural: glyph reagen, siluet pelanggan, cairan
// kauldron, ikon utilitas/relic, dan ornamen. Tanpa aset eksternal.

export const PALETTE = {
  bg: '#1d130b',
  bgDeep: '#140d08',
  panel: '#2a1c11',
  panelEdge: '#4a3220',
  cream: '#f2e6cf',
  creamDim: '#c9b896',
  copper: '#c47b3a',
  copperBright: '#e8a558',
  danger: '#e5484d',
  amber: '#f2b234',
  ok: '#3fb970',
  steel: '#5f7089',
  azureLight: '#8ec9ff',
};

// Bokeh statis latar (posisi tetap agar tidak berkedip antar frame).
const BOKEH = [
  { x: 90, y: 110, r: 30, a: 0.05, c: '#e8a558' },
  { x: 1180, y: 90, r: 24, a: 0.05, c: '#e8a558' },
  { x: 1080, y: 640, r: 34, a: 0.04, c: '#c47b3a' },
  { x: 180, y: 620, r: 26, a: 0.04, c: '#c47b3a' },
  { x: 640, y: 60, r: 20, a: 0.04, c: '#f2e6cf' },
  { x: 320, y: 360, r: 18, a: 0.03, c: '#8ec9ff' },
  { x: 980, y: 330, r: 16, a: 0.03, c: '#8ec9ff' },
  { x: 60, y: 380, r: 18, a: 0.03, c: '#3fb970' },
  { x: 1230, y: 400, r: 18, a: 0.03, c: '#3fb970' },
];

export function clearScreen(ctx, width, height) {
  ctx.fillStyle = PALETTE.bg;
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  ctx.lineWidth = 2;
  for (let y = 120; y < height; y += 120) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
  for (const dot of BOKEH) {
    ctx.globalAlpha = dot.a;
    ctx.fillStyle = dot.c;
    ctx.beginPath();
    ctx.arc(dot.x, dot.y, dot.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

export function drawVignette(ctx, width, height) {
  const g = ctx.createRadialGradient(
    width / 2, height / 2, height * 0.35,
    width / 2, height / 2, height * 0.85,
  );
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(0,0,0,0.38)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, width, height);
}

export function drawPanel(ctx, x, y, w, h, radius = 12) {
  ctx.fillStyle = PALETTE.panel;
  ctx.strokeStyle = PALETTE.panelEdge;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, radius);
  ctx.fill();
  ctx.stroke();
}

export function drawText(ctx, text, x, y, opts = {}) {
  ctx.fillStyle = opts.color || PALETTE.cream;
  ctx.font = opts.font || '20px Georgia, serif';
  ctx.textAlign = opts.align || 'left';
  ctx.textBaseline = opts.baseline || 'alphabetic';
  ctx.fillText(text, x, y);
}

export function drawButton(ctx, rect, label, opts = {}) {
  drawPanel(ctx, rect.x, rect.y, rect.w, rect.h, 10);
  if (opts.fill) {
    ctx.fillStyle = opts.fill;
    ctx.beginPath();
    ctx.roundRect(rect.x, rect.y, rect.w, rect.h, 10);
    ctx.fill();
  }
  drawText(ctx, label, rect.x + rect.w / 2, rect.y + rect.h / 2 + 8, {
    color: opts.color || PALETTE.cream,
    font: opts.font || '26px Georgia, serif',
    align: 'center',
  });
}

export function pointInRect(x, y, rect) {
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}

export function parseRgb(color) {
  if (color.startsWith('#')) {
    const n = parseInt(color.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  const m = color.match(/(\d+)[,\s]+(\d+)[,\s]+(\d+)/);
  if (m) return [Number(m[1]), Number(m[2]), Number(m[3])];
  return [0, 0, 0];
}

export function shadeRgb(color, factor) {
  const [r, g, b] = parseRgb(color);
  return `rgb(${Math.round(r * factor)},${Math.round(g * factor)},${Math.round(b * factor)})`;
}

// Warna campuran proporsional: rata-rata warna elemen di slot kauldron.
// null bila kauldron kosong.
export function mixElementColors(elements) {
  if (!elements || elements.length === 0) return null;
  let r = 0;
  let g = 0;
  let b = 0;
  for (const el of elements) {
    const c = parseRgb(el.color);
    r += c[0];
    g += c[1];
    b += c[2];
  }
  const n = elements.length;
  return `rgb(${Math.round(r / n)},${Math.round(g / n)},${Math.round(b / n)})`;
}

function flamePath(ctx, x, y, r) {
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.quadraticCurveTo(x + r * 0.95, y - r * 0.15, x + r * 0.62, y + r * 0.55);
  ctx.quadraticCurveTo(x + r * 0.35, y + r * 0.95, x, y + r * 0.95);
  ctx.quadraticCurveTo(x - r * 0.35, y + r * 0.95, x - r * 0.62, y + r * 0.55);
  ctx.quadraticCurveTo(x - r * 0.95, y - r * 0.15, x, y - r);
  ctx.closePath();
}

function dropPath(ctx, x, y, r) {
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.bezierCurveTo(x + r * 0.85, y - r * 0.1, x + r * 0.75, y + r * 0.55, x, y + r * 0.9);
  ctx.bezierCurveTo(x - r * 0.75, y + r * 0.55, x - r * 0.85, y - r * 0.1, x, y - r);
  ctx.closePath();
}

function hexPath(ctx, x, y, r) {
  ctx.beginPath();
  for (let i = 0; i < 6; i += 1) {
    const a = Math.PI / 6 + (i * Math.PI) / 3;
    const px = x + r * Math.cos(a);
    const py = y + r * Math.sin(a);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

function starPath(ctx, x, y, r) {
  ctx.beginPath();
  for (let i = 0; i < 10; i += 1) {
    const rad = i % 2 === 0 ? r : r * 0.45;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const px = x + rad * Math.cos(a);
    const py = y + rad * Math.sin(a);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

// Glyph prosedural per elemen: bentuknya beda-beda agar terbaca tanpa teks.
export function drawElementGlyph(ctx, element, x, y, radius) {
  const { color, glow, glyph } = element;
  ctx.save();
  if (glyph === 'flame') {
    flamePath(ctx, x, y, radius);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = glow;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.save();
    ctx.translate(x, y + radius * 0.3);
    ctx.scale(0.5, 0.5);
    flamePath(ctx, 0, 0, radius);
    ctx.fillStyle = glow;
    ctx.fill();
    ctx.restore();
  } else if (glyph === 'drop') {
    dropPath(ctx, x, y, radius);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = glow;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.beginPath();
    ctx.ellipse(x - radius * 0.3, y + radius * 0.25, radius * 0.16, radius * 0.24, -0.4, 0, Math.PI * 2);
    ctx.fill();
  } else if (glyph === 'leaf') {
    ctx.translate(x, y);
    ctx.rotate(-0.6);
    ctx.beginPath();
    ctx.moveTo(0, -radius);
    ctx.quadraticCurveTo(radius * 0.9, 0, 0, radius);
    ctx.quadraticCurveTo(-radius * 0.9, 0, 0, -radius);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = glow;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(20,13,8,0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -radius * 0.7);
    ctx.lineTo(0, radius * 0.7);
    ctx.stroke();
  } else if (glyph === 'shroom') {
    ctx.fillStyle = '#e8dcc3';
    ctx.beginPath();
    ctx.roundRect(x - radius * 0.22, y - radius * 0.1, radius * 0.44, radius * 0.85, radius * 0.2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x - radius, y + radius * 0.05);
    ctx.quadraticCurveTo(x - radius, y - radius * 0.9, x, y - radius * 0.9);
    ctx.quadraticCurveTo(x + radius, y - radius * 0.9, x + radius, y + radius * 0.05);
    ctx.quadraticCurveTo(x, y + radius * 0.35, x - radius, y + radius * 0.05);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = glow;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x - radius * 0.45, y - radius * 0.45, radius * 0.16, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + radius * 0.4, y - radius * 0.3, radius * 0.12, 0, Math.PI * 2);
    ctx.fill();
  } else if (glyph === 'hex') {
    hexPath(ctx, x, y, radius);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = glow;
    ctx.lineWidth = 2;
    ctx.stroke();
    hexPath(ctx, x, y, radius * 0.55);
    ctx.strokeStyle = shadeRgb(color, 0.65);
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, radius * 0.14, 0, Math.PI * 2);
    ctx.fill();
  } else if (glyph === 'star') {
    starPath(ctx, x, y, radius);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = PALETTE.steel;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = PALETTE.steel;
    ctx.beginPath();
    ctx.arc(x, y, radius * 0.14, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// Ikon kartu utilitas: Stir = panah melingkar, Cool = keping salju,
// Purge = lingkaran + garis miring (kosongkan).
export function drawUtilityGlyph(ctx, cardId, x, y, r) {
  ctx.save();
  ctx.lineCap = 'round';
  if (cardId === 'stir') {
    ctx.strokeStyle = PALETTE.copperBright;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y, r * 0.7, 0.4, Math.PI * 1.7);
    ctx.stroke();
    const ax = x + r * 0.7 * Math.cos(Math.PI * 1.7);
    const ay = y + r * 0.7 * Math.sin(Math.PI * 1.7);
    ctx.fillStyle = PALETTE.copperBright;
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(ax - r * 0.35, ay + r * 0.1);
    ctx.lineTo(ax + r * 0.05, ay + r * 0.35);
    ctx.closePath();
    ctx.fill();
  } else if (cardId === 'cool') {
    ctx.strokeStyle = PALETTE.azureLight;
    ctx.lineWidth = 3;
    for (let i = 0; i < 3; i += 1) {
      const a = (i * Math.PI) / 3;
      ctx.beginPath();
      ctx.moveTo(x - r * 0.8 * Math.cos(a), y - r * 0.8 * Math.sin(a));
      ctx.lineTo(x + r * 0.8 * Math.cos(a), y + r * 0.8 * Math.sin(a));
      ctx.stroke();
    }
    ctx.fillStyle = PALETTE.azureLight;
    ctx.beginPath();
    ctx.arc(x, y, r * 0.16, 0, Math.PI * 2);
    ctx.fill();
  } else if (cardId === 'purge') {
    ctx.strokeStyle = PALETTE.cream;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y, r * 0.7, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - r * 0.5, y + r * 0.5);
    ctx.lineTo(x + r * 0.5, y - r * 0.5);
    ctx.stroke();
  }
  ctx.restore();
}

// Ikon relic shop: ladle (centong), bell (lonceng), extraSlot (5 kotak).
export function drawRelicIcon(ctx, relicId, x, y, r) {
  ctx.save();
  ctx.lineCap = 'round';
  if (relicId === 'ladle') {
    ctx.strokeStyle = PALETTE.copperBright;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x + r * 0.1, y - r * 0.1);
    ctx.lineTo(x + r * 0.85, y - r * 0.85);
    ctx.stroke();
    ctx.fillStyle = PALETTE.copper;
    ctx.beginPath();
    ctx.arc(x - r * 0.25, y + r * 0.3, r * 0.55, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = PALETTE.copperBright;
    ctx.lineWidth = 2;
    ctx.stroke();
  } else if (relicId === 'bell') {
    ctx.fillStyle = PALETTE.amber;
    ctx.beginPath();
    ctx.moveTo(x - r * 0.7, y + r * 0.5);
    ctx.quadraticCurveTo(x - r * 0.7, y - r * 0.6, x, y - r * 0.7);
    ctx.quadraticCurveTo(x + r * 0.7, y - r * 0.6, x + r * 0.7, y + r * 0.5);
    ctx.quadraticCurveTo(x, y + r * 0.75, x - r * 0.7, y + r * 0.5);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = PALETTE.copper;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = PALETTE.copper;
    ctx.beginPath();
    ctx.arc(x, y + r * 0.8, r * 0.16, 0, Math.PI * 2);
    ctx.fill();
  } else if (relicId === 'extraSlot') {
    const w = r * 0.7;
    const gap = r * 0.22;
    const total = 5 * w + 4 * gap;
    for (let i = 0; i < 5; i += 1) {
      const sx = x - total / 2 + i * (w + gap);
      ctx.beginPath();
      ctx.roundRect(sx, y - w / 2, w, w, 4);
      if (i === 4) {
        ctx.fillStyle = PALETTE.copperBright;
        ctx.fill();
      }
      ctx.strokeStyle = PALETTE.cream;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }
  ctx.restore();
}

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
  g.addColorStop(0, mixColor);
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
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
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
  ctx.globalAlpha = 0.22;
  ctx.strokeStyle = mixColor;
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.arc(cx, cy, radius + 6, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 0.1;
  ctx.lineWidth = 18;
  ctx.beginPath();
  ctx.arc(cx, cy, radius + 12, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

// Baris ornamen: garis — 6 glyph — garis, untuk pita kosong layar menu.
export function drawOrnamentRow(ctx, elements, cx, y, radius) {
  const gap = radius * 2.6;
  const span = (elements.length - 1) * gap;
  const x0 = cx - span / 2;
  ctx.strokeStyle = PALETTE.panelEdge;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x0 - 110, y);
  ctx.lineTo(x0 - radius - 14, y);
  ctx.moveTo(x0 + span + radius + 14, y);
  ctx.lineTo(x0 + span + 110, y);
  ctx.stroke();
  elements.forEach((el, i) => drawElementGlyph(ctx, el, x0 + i * gap, y, radius));
}
