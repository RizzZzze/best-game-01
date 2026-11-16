// render_cards.js — glyph reagen, ikon utilitas/relic, dan bingkai kartu.
// Bingkai kaya: border ganda + filigree sudut + foil gradasi + glow hover.
// Semua gambar prosedural; glyph terbaca tanpa teks. (Pecahan dari
// render.js, Fase 1 v3: pindah verbatim.)

import { PALETTE, parseRgb, shadeRgb } from './render_scene.js';
import { ELEMENT_BY_ID, RELICS } from './rules.js';

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

// Diekspor agar render_entities bisa memakai path bintang untuk lencana
// Critic; bentuknya tidak berubah.
export function starPath(ctx, x, y, r) {
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
  const shape = RELICS[relicId]?.icon?.shape || relicId;
  const iconElement = RELICS[relicId]?.icon?.element
    ? ELEMENT_BY_ID[RELICS[relicId].icon.element]
    : null;
  if (shape === 'ladle') {
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
  } else if (shape === 'bell') {
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
  } else if (shape === 'extraSlot') {
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
  } else if (shape === 'pestle') {
    // Alu perak diagonal + titik elemen (gloomcap) di ujungnya.
    ctx.strokeStyle = '#c8d4e0';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(x - r * 0.7, y + r * 0.7);
    ctx.lineTo(x + r * 0.5, y - r * 0.5);
    ctx.stroke();
    ctx.fillStyle = '#c8d4e0';
    ctx.beginPath();
    ctx.arc(x + r * 0.6, y - r * 0.6, r * 0.3, 0, Math.PI * 2);
    ctx.fill();
    if (iconElement) drawElementGlyph(ctx, iconElement, x - r * 0.5, y + r * 0.5, r * 0.35);
  } else if (shape === 'retort') {
    // Labu retort: badan bundar + leher miring + garis retak.
    ctx.fillStyle = iconElement ? iconElement.color : '#e5484d';
    ctx.beginPath();
    ctx.arc(x - r * 0.15, y + r * 0.3, r * 0.55, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#c8d4e0';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x + r * 0.15, y - r * 0.05);
    ctx.lineTo(x + r * 0.8, y - r * 0.7);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x - r * 0.4, y + r * 0.05);
    ctx.lineTo(x - r * 0.2, y + r * 0.25);
    ctx.lineTo(x - r * 0.45, y + r * 0.5);
    ctx.stroke();
  } else if (shape === 'strainer') {
    // Saringan linen: mangkuk setengah lingkaran + gagang + lubang.
    ctx.fillStyle = '#d8cbb0';
    ctx.beginPath();
    ctx.arc(x, y + r * 0.1, r * 0.7, 0, Math.PI);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = PALETTE.copper;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.strokeStyle = '#d8cbb0';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x + r * 0.6, y - r * 0.1);
    ctx.lineTo(x + r * 0.95, y - r * 0.5);
    ctx.stroke();
    ctx.fillStyle = '#8a7a68';
    for (const dx of [-0.35, 0, 0.35]) {
      ctx.beginPath();
      ctx.arc(x + dx * r, y + r * 0.45, r * 0.07, 0, Math.PI * 2);
      ctx.fill();
    }
    if (iconElement) drawElementGlyph(ctx, iconElement, x, y - r * 0.5, r * 0.3);
  } else if (shape === 'atlas') {
    // Buku atlas terbuka + noda tinta.
    ctx.fillStyle = '#5f7089';
    ctx.beginPath();
    ctx.moveTo(x - r * 0.85, y - r * 0.3);
    ctx.quadraticCurveTo(x, y - r * 0.55, x + r * 0.85, y - r * 0.3);
    ctx.lineTo(x + r * 0.85, y + r * 0.45);
    ctx.quadraticCurveTo(x, y + r * 0.2, x - r * 0.85, y + r * 0.45);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = PALETTE.cream;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y - r * 0.45);
    ctx.lineTo(x, y + r * 0.3);
    ctx.stroke();
    ctx.fillStyle = '#1c2838';
    ctx.beginPath();
    ctx.arc(x + r * 0.4, y + r * 0.1, r * 0.16, 0, Math.PI * 2);
    ctx.fill();
  } else if (shape === 'fan') {
    // Kipas renda hitam: 5 jari-jari dari poros + busur.
    ctx.strokeStyle = '#2a2a30';
    ctx.lineWidth = 3;
    for (let i = 0; i < 5; i += 1) {
      const a = -Math.PI * 0.85 + (i * Math.PI * 0.7) / 4;
      ctx.beginPath();
      ctx.moveTo(x, y + r * 0.7);
      ctx.lineTo(x + Math.cos(a) * r * 0.9, y + r * 0.7 + Math.sin(a) * r * 0.9);
      ctx.stroke();
    }
    ctx.strokeStyle = '#9a6ee8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y + r * 0.7, r * 0.9, -Math.PI * 0.85, -Math.PI * 0.15);
    ctx.stroke();
    ctx.fillStyle = '#c8d4e0';
    ctx.beginPath();
    ctx.arc(x, y + r * 0.7, r * 0.12, 0, Math.PI * 2);
    ctx.fill();
  } else if (shape === 'whistle') {
    // Peluit timah: tabung + corong + 3 lubang.
    ctx.fillStyle = '#a8b4c0';
    ctx.beginPath();
    ctx.roundRect(x - r * 0.9, y - r * 0.25, r * 1.5, r * 0.5, r * 0.25);
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(x + r * 0.55, y - r * 0.35, r * 0.35, r * 0.7, 3);
    ctx.fill();
    ctx.fillStyle = '#1d130b';
    for (const dx of [-0.55, -0.25, 0.05]) {
      ctx.beginPath();
      ctx.arc(x + dx * r, y, r * 0.08, 0, Math.PI * 2);
      ctx.fill();
    }
    if (iconElement) drawElementGlyph(ctx, iconElement, x + r * 0.55, y - r * 0.6, r * 0.28);
  } else if (shape === 'athanor') {
    // Tungku athanor: lengkung bata + api di dalam.
    ctx.fillStyle = '#6b4423';
    ctx.beginPath();
    ctx.moveTo(x - r * 0.8, y + r * 0.8);
    ctx.lineTo(x - r * 0.8, y);
    ctx.quadraticCurveTo(x - r * 0.8, y - r * 0.8, x, y - r * 0.8);
    ctx.quadraticCurveTo(x + r * 0.8, y - r * 0.8, x + r * 0.8, y);
    ctx.lineTo(x + r * 0.8, y + r * 0.8);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = PALETTE.copperBright;
    ctx.lineWidth = 2;
    ctx.stroke();
    drawElementGlyph(ctx, ELEMENT_BY_ID.cinnabar, x, y + r * 0.3, r * 0.4);
  } else if (shape === 'cucurbit') {
    // Kukurbita: labu destilasi + 3 tetes hujan.
    ctx.fillStyle = '#3a5a78';
    ctx.beginPath();
    ctx.arc(x, y + r * 0.3, r * 0.55, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(x - r * 0.14, y - r * 0.8, r * 0.28, r * 0.6, 3);
    ctx.fill();
    ctx.strokeStyle = '#9db4d4';
    ctx.lineWidth = 2;
    for (const dx of [-0.6, 0.6]) {
      ctx.beginPath();
      ctx.moveTo(x + dx * r, y - r * 0.7);
      ctx.lineTo(x + (dx - 0.12) * r, y - r * 0.3);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(x + r * 0.5, y + r * 0.05);
    ctx.lineTo(x + r * 0.38, y + r * 0.4);
    ctx.stroke();
  } else if (shape === 'aludel') {
    // Aludel: 3 segmen bertumpuk + deret leher kecil.
    ctx.fillStyle = '#7a5230';
    for (let i = 0; i < 3; i += 1) {
      const w = r * (1.1 - i * 0.2);
      ctx.beginPath();
      ctx.roundRect(x - w / 2, y - r * 0.75 + i * r * 0.5, w, r * 0.42, 3);
      ctx.fill();
    }
    ctx.strokeStyle = PALETTE.copperBright;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x - r * 0.55, y - r * 0.75, r * 1.1, r * 1.42, 3);
    ctx.stroke();
    ctx.fillStyle = '#0f0a06';
    for (let i = 0; i < 3; i += 1) {
      ctx.beginPath();
      ctx.arc(x + (i - 1) * r * 0.32, y - r * 0.88, r * 0.08, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (shape === 'pelicanFlask') {
    // Labu pelican: badan bundar + dua lengan sirkulasi.
    ctx.fillStyle = '#8ec9ff';
    ctx.globalAlpha = 0.75;
    ctx.beginPath();
    ctx.arc(x, y + r * 0.25, r * 0.55, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = '#c8d4e0';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x - r * 0.45, y - r * 0.1);
    ctx.quadraticCurveTo(x - r * 0.9, y - r * 0.6, x - r * 0.3, y - r * 0.75);
    ctx.moveTo(x + r * 0.45, y - r * 0.1);
    ctx.quadraticCurveTo(x + r * 0.9, y - r * 0.6, x + r * 0.3, y - r * 0.75);
    ctx.stroke();
    ctx.fillStyle = '#3e9bff';
    ctx.beginPath();
    ctx.arc(x, y + r * 0.45, r * 0.25, 0, Math.PI * 2);
    ctx.fill();
  } else if (shape === 'mortar') {
    // Lesung + alu + stempel pasar kecil.
    ctx.fillStyle = '#5a4632';
    ctx.beginPath();
    ctx.moveTo(x - r * 0.7, y);
    ctx.quadraticCurveTo(x, y + r * 0.9, x + r * 0.7, y);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = PALETTE.copperBright;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.strokeStyle = '#c8d4e0';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x - r * 0.2, y - r * 0.1);
    ctx.lineTo(x + r * 0.6, y - r * 0.8);
    ctx.stroke();
    ctx.fillStyle = PALETTE.amber;
    ctx.beginPath();
    ctx.roundRect(x - r * 0.95, y + r * 0.45, r * 0.4, r * 0.4, 2);
    ctx.fill();
  } else if (shape === 'longGlass') {
    // Gelas tinggi + cairan senja + bayangan panjang.
    ctx.fillStyle = 'rgba(200,212,224,0.35)';
    ctx.beginPath();
    ctx.moveTo(x - r * 0.4, y - r * 0.8);
    ctx.lineTo(x + r * 0.4, y - r * 0.8);
    ctx.lineTo(x + r * 0.28, y + r * 0.7);
    ctx.lineTo(x - r * 0.28, y + r * 0.7);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#c8d4e0';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#e8a558';
    ctx.beginPath();
    ctx.moveTo(x - r * 0.34, y + r * 0.1);
    ctx.lineTo(x + r * 0.34, y + r * 0.1);
    ctx.lineTo(x + r * 0.28, y + r * 0.7);
    ctx.lineTo(x - r * 0.28, y + r * 0.7);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(10,6,3,0.4)';
    ctx.beginPath();
    ctx.moveTo(x + r * 0.28, y + r * 0.7);
    ctx.lineTo(x + r * 0.95, y + r * 0.9);
    ctx.lineTo(x + r * 0.95, y + r * 0.95);
    ctx.lineTo(x - r * 0.28, y + r * 0.75);
    ctx.closePath();
    ctx.fill();
  } else if (shape === 'waxSeal') {
    // Segel lilin merah + cap bintang.
    ctx.fillStyle = '#a03028';
    ctx.beginPath();
    ctx.arc(x, y, r * 0.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#c04a3a';
    ctx.beginPath();
    ctx.arc(x - r * 0.2, y - r * 0.2, r * 0.45, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f2e6cf';
    starPath(ctx, x, y, r * 0.42, r * 0.2);
    ctx.fill();
  } else if (shape === 'debts') {
    // Buku kecil + koin di sampulnya.
    ctx.fillStyle = '#3a5a3a';
    ctx.beginPath();
    ctx.roundRect(x - r * 0.65, y - r * 0.75, r * 1.3, r * 1.5, 4);
    ctx.fill();
    ctx.strokeStyle = PALETTE.copperBright;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - r * 0.35, y - r * 0.75);
    ctx.lineTo(x - r * 0.35, y + r * 0.75);
    ctx.stroke();
    ctx.fillStyle = PALETTE.amber;
    ctx.beginPath();
    ctx.arc(x + r * 0.25, y, r * 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = PALETTE.copper;
    ctx.stroke();
  } else if (shape === 'charter') {
    // Gulungan piagam + kabut.
    ctx.fillStyle = '#d8cbb0';
    ctx.beginPath();
    ctx.roundRect(x - r * 0.85, y - r * 0.4, r * 1.7, r * 0.8, r * 0.4);
    ctx.fill();
    ctx.strokeStyle = PALETTE.copper;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#8a7a68';
    ctx.beginPath();
    ctx.arc(x - r * 0.85, y, r * 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(200,212,224,0.6)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x - r * 0.3, y + r * 0.65);
    ctx.quadraticCurveTo(x + r * 0.2, y + r * 0.4, x + r * 0.7, y + r * 0.65);
    ctx.stroke();
  } else if (shape === 'almanac') {
    // Kalender: halaman + jilid atas + kisi + bintang.
    ctx.fillStyle = '#d8cbb0';
    ctx.beginPath();
    ctx.roundRect(x - r * 0.65, y - r * 0.6, r * 1.3, r * 1.35, 4);
    ctx.fill();
    ctx.strokeStyle = PALETTE.copper;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#a03028';
    ctx.fillRect(x - r * 0.65, y - r * 0.6, r * 1.3, r * 0.3);
    ctx.strokeStyle = '#8a7a68';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x - r * 0.2, y - r * 0.3);
    ctx.lineTo(x - r * 0.2, y + r * 0.6);
    ctx.moveTo(x + r * 0.25, y - r * 0.3);
    ctx.lineTo(x + r * 0.25, y + r * 0.6);
    ctx.moveTo(x - r * 0.65, y + r * 0.15);
    ctx.lineTo(x + r * 0.65, y + r * 0.15);
    ctx.stroke();
    ctx.fillStyle = PALETTE.amber;
    starPath(ctx, x + r * 0.42, y - r * 0.12, r * 0.16, r * 0.07);
    ctx.fill();
  } else if (shape === 'receipt') {
    // Struk: strip + tepi zigzag + 3 baris + cap bintang.
    ctx.fillStyle = '#e8dcc0';
    ctx.beginPath();
    ctx.moveTo(x - r * 0.55, y - r * 0.85);
    ctx.lineTo(x + r * 0.55, y - r * 0.85);
    ctx.lineTo(x + r * 0.55, y + r * 0.7);
    for (let i = 0; i < 4; i += 1) {
      ctx.lineTo(x + r * 0.55 - (i + 0.5) * r * 0.275, y + r * 0.85);
      ctx.lineTo(x + r * 0.55 - (i + 1) * r * 0.275, y + r * 0.7);
    }
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#8a7a68';
    ctx.lineWidth = 1.5;
    for (const dy of [-0.45, -0.15, 0.15]) {
      ctx.beginPath();
      ctx.moveTo(x - r * 0.35, y + dy * r);
      ctx.lineTo(x + r * 0.35, y + dy * r);
      ctx.stroke();
    }
    ctx.fillStyle = '#a03028';
    starPath(ctx, x, y + r * 0.45, r * 0.2, r * 0.09);
    ctx.fill();
  } else if (shape === 'fireflies') {
    // Stoples + 3 kunang-kunang bercahaya di dalamnya.
    ctx.fillStyle = 'rgba(200,212,224,0.3)';
    ctx.beginPath();
    ctx.roundRect(x - r * 0.6, y - r * 0.5, r * 1.2, r * 1.3, r * 0.3);
    ctx.fill();
    ctx.strokeStyle = '#c8d4e0';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#8a7a68';
    ctx.fillRect(x - r * 0.5, y - r * 0.75, r, r * 0.3);
    ctx.fillStyle = '#d8f28a';
    for (const [dx, dy, dr] of [[-0.25, 0.1, 0.14], [0.25, 0.35, 0.12], [0.05, 0.6, 0.1]]) {
      ctx.beginPath();
      ctx.arc(x + dx * r, y + dy * r, dr * r, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (shape === 'snowJar') {
    // Kubah kaca + salju + alas.
    ctx.fillStyle = 'rgba(200,212,224,0.3)';
    ctx.beginPath();
    ctx.arc(x, y + r * 0.4, r * 0.7, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#c8d4e0';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#8a7a68';
    ctx.fillRect(x - r * 0.8, y + r * 0.4, r * 1.6, r * 0.22);
    ctx.fillStyle = '#ffffff';
    for (const [dx, dy] of [[-0.3, -0.1], [0.15, -0.25], [0.35, 0.1], [-0.05, 0.2]]) {
      ctx.beginPath();
      ctx.arc(x + dx * r, y + dy * r, r * 0.08, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (shape === 'crookedLadle') {
    // Sendok sayur BENGKOK: gagang dua segmen + mangkuk.
    ctx.strokeStyle = PALETTE.copperBright;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x - r * 0.1, y + r * 0.1);
    ctx.lineTo(x + r * 0.35, y - r * 0.35);
    ctx.lineTo(x + r * 0.85, y - r * 0.3);
    ctx.stroke();
    ctx.fillStyle = PALETTE.copper;
    ctx.beginPath();
    ctx.arc(x - r * 0.3, y + r * 0.35, r * 0.55, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = PALETTE.copperBright;
    ctx.lineWidth = 2;
    ctx.stroke();
  } else if (shape === 'bloodVial') {
    // Vial kecil + cairan merah + bulan darah mini.
    ctx.fillStyle = 'rgba(200,212,224,0.3)';
    ctx.beginPath();
    ctx.roundRect(x - r * 0.35, y - r * 0.2, r * 0.7, r * 1.0, r * 0.3);
    ctx.fill();
    ctx.strokeStyle = '#c8d4e0';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#e5484d';
    ctx.beginPath();
    ctx.roundRect(x - r * 0.3, y + r * 0.25, r * 0.6, r * 0.5, r * 0.25);
    ctx.fill();
    ctx.fillStyle = '#ff5a4d';
    ctx.beginPath();
    ctx.arc(x + r * 0.45, y - r * 0.55, r * 0.28, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(20,10,10,0.5)';
    ctx.beginPath();
    ctx.arc(x + r * 0.38, y - r * 0.6, r * 0.07, 0, Math.PI * 2);
    ctx.fill();
  }
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
