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

// ---- Tambahan visual Fase A (di bawah deklarasi yang sudah ada) ----

// Mencerahkan warna rgb/hex dengan faktor > 1 (dibatasi 255 per kanal).
export function brightenRgb(color, factor) {
  const [r, g, b] = parseRgb(color);
  const lift = (c) => Math.min(255, Math.round(c * factor));
  return `rgb(${lift(r)},${lift(g)},${lift(b)})`;
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

// ---- Keluarga tema per hari: fungsi murni dari nomor hari ----
export const DAY_THEMES = [
  {
    name: 'DAWN MARKET', skyTop: '#2a1a20', skyBottom: '#4a2c1c',
    celestial: 'sun', celestialColor: '#f2c98a',
    ambient: 'mote', ambientColor: '#e8c890', hudTint: '#f2c98a', flash: 0,
  },
  {
    name: 'MIDDAY MARKET', skyTop: '#2c2113', skyBottom: '#5a3d1a',
    celestial: 'sun', celestialColor: '#ffe9b0',
    ambient: 'mote', ambientColor: '#f2e0a8', hudTint: '#ffe9b0', flash: 0,
  },
  {
    name: 'RAINY DUSK', skyTop: '#1c1626', skyBottom: '#33283f',
    celestial: 'none', celestialColor: null,
    ambient: 'rain', ambientColor: '#8ea0c0', hudTint: '#b8a8d8', flash: 0,
  },
  {
    name: 'NIGHT STORM', skyTop: '#0e1420', skyBottom: '#1c2838',
    celestial: 'none', celestialColor: null,
    ambient: 'rain', ambientColor: '#7a90b0', hudTint: '#8ec9ff', flash: 1,
  },
  {
    name: 'BLOOD MOON', skyTop: '#241014', skyBottom: '#3d1a1a',
    celestial: 'bloodMoon', celestialColor: '#e5484d',
    ambient: 'ember', ambientColor: '#e87a4d', hudTint: '#f28a7a', flash: 0,
  },
];

export function themeFor(day) {
  const idx = Math.min(4, Math.max(0, Math.floor((day - 1) / 2)));
  return DAY_THEMES[idx];
}

// Tata letak latar statis (posisi tetap, tanpa RNG): atap kios di strip
// langit, botol di rak samping, dan titik glow hangat di pita tengah.
const SKYLINE_ROOFS = [
  { x: 30, w: 70, h: 10 }, { x: 120, w: 90, h: 14 }, { x: 230, w: 60, h: 8 },
  { x: 310, w: 100, h: 12 }, { x: 430, w: 70, h: 9 }, { x: 520, w: 80, h: 13 },
  { x: 620, w: 60, h: 8 }, { x: 700, w: 90, h: 12 }, { x: 810, w: 70, h: 10 },
  { x: 900, w: 100, h: 14 }, { x: 1020, w: 60, h: 9 }, { x: 1100, w: 90, h: 12 },
  { x: 1210, w: 50, h: 8 },
];
const SKYLINE_LIGHTS = [
  { x: 55, y: 86 }, { x: 160, y: 84 }, { x: 355, y: 85 }, { x: 560, y: 83 },
  { x: 745, y: 85 }, { x: 945, y: 84 }, { x: 1140, y: 85 },
];
const SHELF_BOTTLES = [
  { side: 0, shelf: 0, dx: 6, w: 9, h: 22, c: '#e5484d' },
  { side: 0, shelf: 0, dx: 19, w: 11, h: 26, c: '#3a86d4' },
  { side: 0, shelf: 0, dx: 33, w: 8, h: 18, c: '#3fb970' },
  { side: 0, shelf: 1, dx: 8, w: 10, h: 24, c: '#9a6ee8' },
  { side: 0, shelf: 1, dx: 22, w: 9, h: 20, c: '#f2b234' },
  { side: 0, shelf: 1, dx: 34, w: 8, h: 16, c: '#c9d4e8' },
  { side: 1, shelf: 0, dx: 5, w: 8, h: 18, c: '#3fb970' },
  { side: 1, shelf: 0, dx: 17, w: 10, h: 24, c: '#f2b234' },
  { side: 1, shelf: 0, dx: 30, w: 9, h: 20, c: '#e5484d' },
  { side: 1, shelf: 1, dx: 7, w: 9, h: 20, c: '#3a86d4' },
  { side: 1, shelf: 1, dx: 20, w: 11, h: 26, c: '#c9d4e8' },
  { side: 1, shelf: 1, dx: 34, w: 8, h: 17, c: '#9a6ee8' },
];
const GLOW_DOTS = [
  { x: 150, y: 310, r: 26, phase: 0 },
  { x: 1130, y: 310, r: 26, phase: 2.1 },
  { x: 120, y: 470, r: 22, phase: 4.2 },
  { x: 1160, y: 470, r: 22, phase: 1.3 },
  { x: 300, y: 482, r: 18, phase: 3.1 },
  { x: 980, y: 482, r: 18, phase: 5.4 },
];

// Latar berlapis layar play: strip langit bertema + siluet kios + tiang
// kayu + lentera + rak botol + glow hangat. Dipanggil sekali per frame
// sebelum panel; semua gerakan fungsi dari animTime (deterministik).
export function drawBackground(ctx, state) {
  const time = state.animTime || 0;
  const theme = themeFor(state.day || 1);
  clearScreen(ctx, 1280, 720);
  // Strip langit bertema (0-92px) + benda langit.
  const sky = ctx.createLinearGradient(0, 0, 0, 92);
  sky.addColorStop(0, theme.skyTop);
  sky.addColorStop(1, theme.skyBottom);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, 1280, 92);
  if (theme.celestial === 'sun' || theme.celestial === 'bloodMoon') {
    const [r, g, b] = parseRgb(theme.celestialColor);
    const glow = ctx.createRadialGradient(640, 76, 4, 640, 76, 34);
    glow.addColorStop(0, `rgba(${r},${g},${b},0.35)`);
    glow.addColorStop(1, `rgba(${r},${g},${b},0)`);
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(640, 76, 34, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = theme.celestialColor;
    ctx.beginPath();
    ctx.arc(640, 76, theme.celestial === 'bloodMoon' ? 13 : 11, 0, Math.PI * 2);
    ctx.fill();
    if (theme.celestial === 'bloodMoon') {
      ctx.fillStyle = 'rgba(20,10,10,0.35)';
      ctx.beginPath();
      ctx.arc(636, 73, 3, 0, Math.PI * 2);
      ctx.arc(644, 79, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (theme.celestial === 'none') {
    ctx.fillStyle = 'rgba(242,230,207,0.10)';
    ctx.fillRect(0, 78, 1280, 14);
    if (theme.flash) {
      ctx.fillStyle = 'rgba(10,14,22,0.55)';
      for (const bx of [240, 640, 1020]) {
        ctx.beginPath();
        ctx.ellipse(bx, 58, 90, 16, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      const f = Math.pow(Math.max(0, Math.sin(time * 0.7)), 24);
      if (f > 0.01) {
        ctx.fillStyle = `rgba(200,220,255,${f * 0.22})`;
        ctx.fillRect(0, 0, 1280, 92);
      }
    }
  }
  // Siluet atap kios + jendela hangat di dasar strip langit.
  ctx.fillStyle = 'rgba(15,10,6,0.55)';
  for (const roof of SKYLINE_ROOFS) {
    ctx.beginPath();
    ctx.moveTo(roof.x, 92);
    ctx.lineTo(roof.x + roof.w / 2, 92 - roof.h);
    ctx.lineTo(roof.x + roof.w, 92);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = 'rgba(242,178,52,0.7)';
  for (const light of SKYLINE_LIGHTS) {
    ctx.fillRect(light.x, light.y, 3, 3);
  }
  // Tepi awning bergerigi di bawah strip langit.
  for (let x = 0; x < 1280; x += 32) {
    ctx.fillStyle = (x / 32) % 2 === 0 ? 'rgba(58,31,20,0.85)' : 'rgba(42,28,17,0.85)';
    ctx.beginPath();
    ctx.arc(x + 16, 92, 16, 0, Math.PI);
    ctx.fill();
  }
  // Tiang kayu di kedua tepi layar.
  for (const px of [0, 1258]) {
    ctx.fillStyle = '#241610';
    ctx.fillRect(px, 0, 22, 720);
    ctx.fillStyle = 'rgba(232,165,88,0.15)';
    ctx.fillRect(px === 0 ? 20 : 1258, 0, 2, 720);
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(px + 6, 0, 2, 720);
    ctx.fillStyle = 'rgba(196,123,58,0.6)';
    for (const ny of [180, 380, 580, 680]) {
      ctx.beginPath();
      ctx.arc(px + 11, ny, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  // Lentera gantung yang berkelip di margin kiri/kanan.
  for (const [lx, phase] of [[36, 0], [1244, 2.1]]) {
    const flicker = 0.5 + 0.2 * Math.sin(time * 3 + phase);
    ctx.strokeStyle = 'rgba(20,13,8,0.9)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(lx, 92);
    ctx.lineTo(lx, 100);
    ctx.stroke();
    const lg = ctx.createRadialGradient(lx, 112, 2, lx, 112, 28);
    lg.addColorStop(0, `rgba(242,178,52,${0.22 * flicker + 0.08})`);
    lg.addColorStop(1, 'rgba(242,178,52,0)');
    ctx.fillStyle = lg;
    ctx.beginPath();
    ctx.arc(lx, 112, 28, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#3a2410';
    ctx.beginPath();
    ctx.roundRect(lx - 9, 100, 18, 26, 5);
    ctx.fill();
    ctx.strokeStyle = PALETTE.copper;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = `rgba(242,178,52,${flicker + 0.3})`;
    ctx.beginPath();
    ctx.arc(lx, 112, 5, 0, Math.PI * 2);
    ctx.fill();
  }
  // Rak botol di margin kiri/kanan (2 rak per sisi).
  for (const side of [0, 1]) {
    const x0 = side === 0 ? 6 : 1224;
    for (const shelfY of [330, 430]) {
      ctx.fillStyle = '#3a2410';
      ctx.fillRect(x0, shelfY, 44, 6);
      ctx.fillStyle = 'rgba(232,165,88,0.25)';
      ctx.fillRect(x0, shelfY, 44, 1.5);
    }
  }
  for (const bottle of SHELF_BOTTLES) {
    const x0 = bottle.side === 0 ? 6 : 1224;
    const shelfY = bottle.shelf === 0 ? 330 : 430;
    const bx = x0 + bottle.dx;
    const by = shelfY - bottle.h;
    ctx.fillStyle = bottle.c;
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.roundRect(bx, by, bottle.w, bottle.h, 3);
    ctx.fill();
    ctx.fillRect(bx + bottle.w / 2 - 2, by - 4, 4, 5);
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillRect(bx + 2, by + 3, 2, bottle.h - 6);
    ctx.globalAlpha = 1;
  }
  // Titik glow hangat yang berdenyut di pita tengah.
  for (const dot of GLOW_DOTS) {
    const a = 0.05 + 0.02 * Math.sin(time * 0.9 + dot.phase);
    const dg = ctx.createRadialGradient(dot.x, dot.y, 2, dot.x, dot.y, dot.r);
    dg.addColorStop(0, `rgba(232,165,88,${a})`);
    dg.addColorStop(1, 'rgba(232,165,88,0)');
    ctx.fillStyle = dg;
    ctx.beginPath();
    ctx.arc(dot.x, dot.y, dot.r, 0, Math.PI * 2);
    ctx.fill();
  }
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

// Bingkai kartu kaya: border ganda + filigree sudut + foil gradasi +
// glow saat hover. Ornamen hanya di bingkai; glyph dan nama tidak berubah.
export function drawCardFrame(ctx, rect, opts = {}) {
  const tint = opts.tint || PALETTE.copper;
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(rect.x, rect.y, rect.w, rect.h, 10);
  ctx.fillStyle = PALETTE.panel;
  ctx.fill();
  ctx.save();
  ctx.clip();
  const sheen = ctx.createLinearGradient(rect.x, rect.y, rect.x + rect.w, rect.y + rect.h);
  sheen.addColorStop(0, 'rgba(255,255,255,0.10)');
  sheen.addColorStop(0.45, 'rgba(255,255,255,0)');
  sheen.addColorStop(0.6, 'rgba(255,255,255,0.03)');
  sheen.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = sheen;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  const [tr, tg, tb] = parseRgb(tint);
  const wash = ctx.createLinearGradient(0, rect.y, 0, rect.y + rect.h * 0.55);
  wash.addColorStop(0, `rgba(${tr},${tg},${tb},0.16)`);
  wash.addColorStop(1, `rgba(${tr},${tg},${tb},0)`);
  ctx.fillStyle = wash;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h * 0.55);
  ctx.restore();
  if (opts.hover) {
    ctx.shadowColor = tint;
    ctx.shadowBlur = 18;
  }
  ctx.strokeStyle = tint;
  ctx.lineWidth = opts.hover ? 3 : 2.5;
  ctx.globalAlpha = 0.9;
  ctx.beginPath();
  ctx.roundRect(rect.x + 1, rect.y + 1, rect.w - 2, rect.h - 2, 9);
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;
  ctx.strokeStyle = 'rgba(232,165,88,0.55)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(rect.x + 4, rect.y + 4, rect.w - 8, rect.h - 8, 7);
  ctx.stroke();
  // Filigree sudut: flourish-L + titik di tiap sudut bingkai.
  ctx.strokeStyle = 'rgba(232,165,88,0.8)';
  ctx.lineWidth = 1.5;
  const corners = [
    { x: rect.x + 8, y: rect.y + 8, sx: 1, sy: 1 },
    { x: rect.x + rect.w - 8, y: rect.y + 8, sx: -1, sy: 1 },
    { x: rect.x + 8, y: rect.y + rect.h - 8, sx: 1, sy: -1 },
    { x: rect.x + rect.w - 8, y: rect.y + rect.h - 8, sx: -1, sy: -1 },
  ];
  for (const c of corners) {
    ctx.beginPath();
    ctx.moveTo(c.x, c.y + 9 * c.sy);
    ctx.lineTo(c.x, c.y);
    ctx.lineTo(c.x + 9 * c.sx, c.y);
    ctx.stroke();
    ctx.fillStyle = 'rgba(232,165,88,0.8)';
    ctx.beginPath();
    ctx.arc(c.x + 3 * c.sx, c.y + 3 * c.sy, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// Gambar glyph sekali dengan bayangan emboss (gelap di bawah, tanpa
// menambah path call — signature glyph di tes tidak berubah).
export function drawGlyphEmbossed(ctx, drawFn) {
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.65)';
  ctx.shadowBlur = 2;
  ctx.shadowOffsetY = 3;
  drawFn();
  ctx.restore();
}
