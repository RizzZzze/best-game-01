// render_scene.js — primitif canvas + palet apothecary + backdrop tema.
// Palet: latar coklat sangat gelap, panel kayu gelap, teks krim, aksen
// tembaga. Berisi utilitas warna, primitif gambar (panel/teks/tombol),
// keluarga tema per hari, dan latar berlapis layar play. Tanpa aset
// eksternal. (Pecahan dari render.js, Fase 1 v3: pindah verbatim.)

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

// Mencerahkan warna rgb/hex dengan faktor > 1 (dibatasi 255 per kanal).
export function brightenRgb(color, factor) {
  const [r, g, b] = parseRgb(color);
  const lift = (c) => Math.min(255, Math.round(c * factor));
  return `rgb(${lift(r)},${lift(g)},${lift(b)})`;
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
