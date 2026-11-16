// render.js — primitif canvas + palet apothecary.
// Palet: latar coklat sangat gelap, panel kayu gelap, teks krim, aksen
// tembaga. Glyph reagen prosedural menyusul di fase art pass; fase 1 memakai
// lingkaran berwarna + huruf awal sebagai placeholder yang masih terbaca.

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
};

export function clearScreen(ctx, width, height) {
  ctx.fillStyle = PALETTE.bg;
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

// Placeholder glyph fase 1: cakram warna elemen + huruf awal nama.
// Diganti glyph prosedural (api/tetes/daun/jamur/heksagon/bintang) di art pass.
export function drawElementDisc(ctx, element, x, y, radius) {
  ctx.fillStyle = element.color;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = element.glow;
  ctx.lineWidth = 2;
  ctx.stroke();
  drawText(ctx, element.name[0], x, y + radius * 0.35, {
    color: '#1d130b',
    font: `bold ${Math.round(radius)}px Georgia, serif`,
    align: 'center',
  });
}
