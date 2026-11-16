// ui.js — HUD, menu, dan semua layar. Satu-satunya file yang menggambar
// teks layar penuh. LAYOUT adalah sumber tunggal koordinat tombol, dipakai
// juga oleh states.js untuk hit-test klik.

import {
  ELEMENTS,
  ELEMENT_BY_ID,
  PLAY_CONTROLS_LINE,
  RELICS,
  TITLE_CONTROLS,
  UTILITIES,
  dayConfig,
  deckComposition,
  offerText,
  offerTitle,
  rankFor,
} from './rules.js';
import {
  PALETTE,
  clearScreen,
  drawBackground,
  drawButton,
  drawPanel,
  drawText,
  drawVignette,
  effectiveThemeFor,
  mixElementColors,
  pointInRect,
} from './render_scene.js';
import {
  drawCardFrame,
  drawElementGlyph,
  drawGlyphEmbossed,
  drawOrnamentRow,
  drawRelicIcon,
  drawUtilityGlyph,
} from './render_cards.js';
import {
  SILHOUETTE_ACCENTS,
  drawCauldronBlobs,
  drawCauldronHalo,
  drawCauldronLiquid,
  drawCustomerPortrait,
  drawSilhouette,
  drawSteam,
} from './render_entities.js';
import { LEDGER_SIZE, ledgerCount } from './ledger.js';
import {
  PATRONS,
  PATRON_BY_ID,
  metCount,
  moodColor,
  moodFor,
} from './regulars.js';
import { marketChipText } from './market.js';

export const LAYOUT = {
  startButton: { x: 490, y: 556, w: 300, h: 64 },
  beginButton: { x: 490, y: 520, w: 300, h: 60 },
  continueButton: { x: 490, y: 612, w: 300, h: 56 },
  playAgainButton: { x: 490, y: 520, w: 300, h: 64 },
  resumeButton: { x: 490, y: 420, w: 300, h: 56 },
  ledgerButton: { x: 1094, y: 664, w: 170, h: 40 },
  newLedgerButton: { x: 16, y: 664, w: 170, h: 40 },
  backButton: { x: 1094, y: 664, w: 170, h: 40 },
};

// Kartu shop di layar gabungan Ledger-and-Shop (Fase 2): kolom kiri
// ditempati grid Ledger + roster regular, tiga kartu menempati kanan.
export function shopCardRect(index) {
  return { x: 452 + index * 264, y: 250, w: 250, h: 260 };
}

// Zona klik layar play — sumber tunggal untuk gambar + hit-test main.js.
export function handCardRect(handLength, index) {
  const w = 104;
  const spacing =
    handLength <= 1 ? 122 : Math.min(122, (1240 - w) / (handLength - 1));
  const total = w + (handLength - 1) * spacing;
  const x = (1280 - total) / 2 + index * spacing;
  return { x, y: 520, w, h: 130 };
}

export function cauldronSlotRect(slotCount, index) {
  const x = 640 - ((slotCount - 1) * 62) / 2 + index * 62;
  return { x: x - 26, y: 374, w: 52, h: 52 };
}

export const CATALYST_RECT = { x: 790, y: 370, w: 120, h: 60 };

// Panel pelanggan terpusat sebagai grup: 4 panel (280px + gap 16) muat
// dalam 1280px dengan margin 56px di tiap sisi.
export function customerRect(index, count) {
  const w = 280;
  const gap = 16;
  const total = count * w + (count - 1) * gap;
  const x = (1280 - total) / 2 + index * (w + gap);
  return { x, y: 96, w, h: 150 };
}

function heartsLine(hearts, max) {
  let line = '';
  for (let i = 0; i < max; i += 1) line += i < hearts ? '♥ ' : '♡ ';
  return line.trim();
}

function drawTitleChip(ctx, text, x, y, alignRight) {
  ctx.font = '20px Georgia, serif';
  const w = ctx.measureText(text).width + 28;
  const left = alignRight ? x - w : x;
  drawPanel(ctx, left, y, w, 30, 15);
  drawText(ctx, text, left + w / 2, y + 21, { font: '20px Georgia, serif', align: 'center', color: PALETTE.creamDim });
}

function drawTitle(ctx, state) {
  clearScreen(ctx, 1280, 720);
  // Chip meta sesi (Fase 2) di sudut atas — kolom tengah title tidak berubah.
  const best = state.ledger && state.ledger.bestRun;
  drawTitleChip(ctx, `LEDGER ${ledgerCount(state.ledger)}/${LEDGER_SIZE}`, 16, 16, false);
  drawTitleChip(ctx, `REGULARS ${metCount(state.ledger)}/${PATRONS.length}`, 16, 52, false);
  drawTitleChip(
    ctx,
    best ? `BEST RUN ${best.score} · ${best.rank} · DAY ${best.day}` : 'BEST RUN —',
    1264,
    16,
    true,
  );
  drawTitleChip(ctx, marketChipText(state.dailyMarket), 1264, 52, true);
  drawText(ctx, 'ALEMBIC RUSH', 640, 120, {
    font: '64px Georgia, serif',
    align: 'center',
    color: PALETTE.copperBright,
  });
  drawText(ctx, 'potion-deck brewing: chain catalyst reactions, serve the queue before patience boils off', 640, 162, {
    font: '20px Georgia, serif',
    align: 'center',
    color: PALETTE.creamDim,
  });
  drawText(ctx, 'Serve 10 shifts without losing all five hearts', 640, 200, {
    font: '22px Georgia, serif',
    align: 'center',
  });
  let y = 258;
  for (const line of TITLE_CONTROLS) {
    drawText(ctx, line, 640, y, { font: '20px Georgia, serif', align: 'center', color: PALETTE.creamDim });
    y += 30;
  }
  drawOrnamentRow(ctx, ELEMENTS, 640, 495, 16);
  drawButton(ctx, LAYOUT.startButton, 'START', { fill: '#6b4423' });
  drawText(ctx, `Best score: ${state.bestScore}`, 640, 660, {
    font: '20px Georgia, serif',
    align: 'center',
    color: PALETTE.creamDim,
  });
  drawButton(ctx, LAYOUT.newLedgerButton, state.newLedgerArmed ? 'SURE?' : 'NEW LEDGER', {
    fill: state.newLedgerArmed ? '#7a2a1e' : '#3a2a1c',
    font: '20px Georgia, serif',
  });
  drawButton(ctx, LAYOUT.ledgerButton, 'LEDGER', { fill: '#3a2a1c', font: '20px Georgia, serif' });
}

function drawDayIntro(ctx, state) {
  clearScreen(ctx, 1280, 720);
  const cfg = dayConfig(state.day);
  drawText(ctx, `DAY ${state.day} / 10`, 640, 150, {
    font: '56px Georgia, serif',
    align: 'center',
    color: PALETTE.copperBright,
  });
  drawText(ctx, `Serve ${cfg.quota} orders. Patience: ${cfg.patience}s. Queue: up to ${cfg.queueMax}.`, 640, 210, {
    font: '22px Georgia, serif',
    align: 'center',
  });
  let y = 260;
  for (const note of state.introNotes || []) {
    drawText(ctx, note, 640, y, { font: '20px Georgia, serif', align: 'center', color: PALETTE.creamDim });
    y += 30;
  }
  if (state.dailyMarket && state.dailyMarket.day === state.day) {
    const theme = effectiveThemeFor(state.day, state.dailyMarket);
    drawText(ctx, `Today's market brings ${theme.name} skies to this shift.`, 640, y, {
      font: '20px Georgia, serif',
      align: 'center',
      color: theme.hudTint,
    });
    y += 30;
  }
  const deckSize = deckComposition(state.day, state.extraCards || []).length;
  const relicNames = (state.ownedRelics || []).map((id) => RELICS[id].name);
  drawText(
    ctx,
    `Deck: ${deckSize} cards   Relics: ${relicNames.length > 0 ? relicNames.join(', ') : 'none yet'}`,
    640,
    y + 10,
    { font: '20px Georgia, serif', align: 'center', color: PALETTE.creamDim },
  );
  drawOrnamentRow(ctx, ELEMENTS, 640, 430, 16);
  drawButton(ctx, LAYOUT.beginButton, 'BEGIN SHIFT', { fill: '#6b4423' });
  drawText(ctx, `Score: ${state.score}   Coins: ${state.coins}   Hearts: ${heartsLine(state.hearts, 5)}`, 640, 640, {
    font: '20px Georgia, serif',
    align: 'center',
  });
}

function patienceColor(fraction) {
  if (fraction > 0.5) return PALETTE.ok;
  if (fraction > 0.25) return PALETTE.amber;
  return PALETTE.danger;
}

function drawCustomers(ctx, state) {
  const queue = state.queue || [];
  const shake = state.rejectFlash > 0 ? Math.sin(state.rejectFlash * 30) * 5 : 0;
  queue.forEach((customer, i) => {
    const base = customerRect(i, queue.length);
    const x = base.x + (state.targetId === customer.id ? shake : 0);
    const y = base.y;
    drawPanel(ctx, x, y, base.w, base.h, 12);
    const fraction = customer.maxPatience > 0 ? customer.patience / customer.maxPatience : 0;
    const patron = customer.patronId ? PATRON_BY_ID[customer.patronId] : null;
    const accent = patron ? patron.accent : SILHOUETTE_ACCENTS[customer.id % SILHOUETTE_ACCENTS.length];
    drawCustomerPortrait(ctx, customer, x + 40, y + 40, 22, accent);
    ctx.strokeStyle = patienceColor(fraction);
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(x + 40, y + 40, 26, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * fraction);
    ctx.stroke();
    const tag = patron ? patron.short.toUpperCase() : customer.critic ? 'CRITIC' : customer.purist ? 'PURIST' : 'GUEST';
    drawText(ctx, tag, x + 80, y + 36, { font: '20px Georgia, serif', color: PALETTE.copperBright });
    drawText(ctx, `${Math.ceil(customer.patience)}s`, x + 80, y + 62, {
      font: '20px Georgia, serif',
      color: patienceColor(fraction),
    });
    if (patron) {
      // Ikon favorit + titik mood di kanan panel (ruang kosong panel).
      drawElementGlyph(ctx, ELEMENT_BY_ID[patron.favorite], x + base.w - 32, y + 30, 13);
      const record = state.ledger ? state.ledger.regulars[patron.id] : null;
      const mood = moodFor(record);
      ctx.fillStyle = moodColor(mood);
      ctx.beginPath();
      ctx.arc(x + base.w - 32, y + 60, 7, 0, Math.PI * 2);
      ctx.fill();
    }
    if (state.targetId === customer.id) {
      ctx.strokeStyle = PALETTE.copperBright;
      ctx.lineWidth = 3;
      ctx.strokeRect(x - 4, y - 4, base.w + 8, base.h + 8);
      drawText(ctx, '▼ TARGET', x + base.w / 2, y - 10, {
        font: '20px Georgia, serif',
        align: 'center',
        color: PALETTE.copperBright,
      });
    }
    customer.recipe.forEach((elId, j) => {
      drawElementGlyph(ctx, ELEMENT_BY_ID[elId], x + 34 + j * 52, y + 108, 20);
    });
  });
}

function drawCauldron(ctx, state) {
  const shake = state.rejectFlash > 0 ? Math.sin(state.rejectFlash * 30) * 5 : 0;
  const cx = 640 + shake;
  const cy = 400;
  const slots = state.cauldron ? state.cauldron.slots : [];
  const filled = slots.filter(Boolean).map((cardId) => ELEMENT_BY_ID[cardId]);
  const mixColor = mixElementColors(filled);
  drawCauldronHalo(ctx, cx, cy, 86, mixColor);
  ctx.fillStyle = '#0f0a06';
  ctx.beginPath();
  ctx.arc(cx, cy, 86, 0, Math.PI * 2);
  ctx.fill();
  drawCauldronLiquid(ctx, cx, cy, 86, mixColor, state.animTime || 0);
  drawCauldronBlobs(ctx, cx, cy, 86, filled, state.animTime || 0);
  if (mixColor) drawSteam(ctx, cx, cy, 86, state.animTime || 0);
  ctx.strokeStyle = PALETTE.copper;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(cx, cy, 86, 0, Math.PI * 2);
  ctx.stroke();
  drawText(ctx, 'CAULDRON', cx, cy - 96, { font: '20px Georgia, serif', align: 'center', color: PALETTE.creamDim });
  slots.forEach((cardId, i) => {
    const rect = cauldronSlotRect(slots.length, i);
    drawPanel(ctx, rect.x + shake, rect.y, rect.w, rect.h, 8);
    if (cardId) drawElementGlyph(ctx, ELEMENT_BY_ID[cardId], rect.x + shake + 26, cy, 20);
  });
  drawPanel(ctx, CATALYST_RECT.x, CATALYST_RECT.y, CATALYST_RECT.w, CATALYST_RECT.h, 8);
  drawText(ctx, 'CATALYST', CATALYST_RECT.x + CATALYST_RECT.w / 2, CATALYST_RECT.y - 10, { font: '20px Georgia, serif', align: 'center', color: PALETTE.creamDim });
  if (state.cauldron && state.cauldron.catalyst) {
    const el = ELEMENT_BY_ID[state.cauldron.catalyst];
    ctx.strokeStyle = el.glow;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(CATALYST_RECT.x + CATALYST_RECT.w / 2, cy, 27, 0, Math.PI * 2);
    ctx.stroke();
    drawElementGlyph(ctx, el, CATALYST_RECT.x + CATALYST_RECT.w / 2, cy, 20);
  }
}

function drawHand(ctx, state) {
  const hand = state.hand || [];
  hand.forEach((cardId, i) => {
    const rect = handCardRect(hand.length, i);
    const x = rect.x + rect.w / 2;
    const y = rect.y;
    const tint = ELEMENT_BY_ID[cardId] ? ELEMENT_BY_ID[cardId].color : PALETTE.copper;
    const hover = Boolean(state.mouse && pointInRect(state.mouse.x, state.mouse.y, rect));
    drawCardFrame(ctx, rect, { tint, hover });
    if (state.selected === i) {
      ctx.strokeStyle = PALETTE.copperBright;
      ctx.lineWidth = 3;
      ctx.strokeRect(x - 56, y - 4, 112, 138);
      ctx.fillStyle = 'rgba(232,165,88,0.15)';
      ctx.beginPath();
      ctx.arc(x, y + 46, 34, 0, Math.PI * 2);
      ctx.fill();
    }
    if (ELEMENT_BY_ID[cardId]) {
      drawGlyphEmbossed(ctx, () => drawElementGlyph(ctx, ELEMENT_BY_ID[cardId], x, y + 46, 26));
      drawText(ctx, ELEMENT_BY_ID[cardId].name, x, y + 104, { font: '20px Georgia, serif', align: 'center' });
    } else if (UTILITIES[cardId]) {
      drawGlyphEmbossed(ctx, () => drawUtilityGlyph(ctx, cardId, x, y + 46, 26));
      drawText(ctx, UTILITIES[cardId].name, x, y + 104, { font: '20px Georgia, serif', align: 'center' });
    }
  });
}

function drawPlay(ctx, state) {
  drawBackground(ctx, state);
  const cfg = dayConfig(state.day);
  const theme = effectiveThemeFor(state.day, state.dailyMarket);
  drawText(ctx, `DAY ${state.day}/10`, 24, 40, { font: '22px Georgia, serif', color: theme.hudTint });
  ctx.font = '22px Georgia, serif';
  const dayWidth = ctx.measureText(`DAY ${state.day}/10`).width;
  const pillX = 24 + dayWidth + 14;
  ctx.font = '20px Georgia, serif';
  const pillW = ctx.measureText(theme.name).width + 24;
  ctx.fillStyle = 'rgba(20,13,8,0.75)';
  ctx.strokeStyle = theme.hudTint;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(pillX, 16, pillW, 30, 15);
  ctx.fill();
  ctx.stroke();
  drawText(ctx, theme.name, pillX + pillW / 2, 37, { font: '20px Georgia, serif', align: 'center', color: theme.hudTint });
  drawText(ctx, `Served ${state.servedToday}/${cfg.quota}`, 340, 40, { font: '22px Georgia, serif' });
  drawText(ctx, `SCORE ${state.score}`, 490, 40, { font: '22px Georgia, serif' });
  drawText(ctx, `COINS ${state.coins}`, 640, 40, { font: '22px Georgia, serif' });
  drawText(ctx, heartsLine(state.hearts, 5), 760, 40, { font: '22px Georgia, serif', color: PALETTE.danger });
  drawText(ctx, `COMBO x${state.combo}`, 915, 40, { font: '22px Georgia, serif' });
  drawText(ctx, state.audio && state.audio.muted ? 'M: MUTED' : 'M: SOUND', 1090, 40, { font: '22px Georgia, serif' });
  if (state.freezeLeft > 0) {
    drawText(ctx, `FROZEN ${Math.ceil(state.freezeLeft)}s`, 1256, 70, {
      font: '20px Georgia, serif',
      align: 'right',
      color: '#8ec9ff',
    });
  }
  drawDayStrip(ctx, state);
  drawObjectiveChip(ctx);
  drawRelicStack(ctx, state);
  drawDeckCounts(ctx, state);
  drawCustomers(ctx, state);
  drawCauldron(ctx, state);
  drawHand(ctx, state);
  if (state.particles) state.particles.draw(ctx);
  drawText(ctx, PLAY_CONTROLS_LINE, 640, 700, { font: '20px Georgia, serif', align: 'center', color: PALETTE.creamDim });
  if (state.eventBanner && state.eventBannerLeft > 0 && !state.paused) {
    ctx.font = '20px Georgia, serif';
    const bw = ctx.measureText(state.eventBanner).width + 40;
    drawPanel(ctx, 640 - bw / 2, 652, bw, 30, 15);
    drawText(ctx, state.eventBanner, 640, 673, { font: '20px Georgia, serif', align: 'center', color: PALETTE.copperBright });
  }
  if (state.notice && state.noticeLeft > 0 && !state.paused) {
    drawText(ctx, state.notice, 640, 276, { font: '22px Georgia, serif', align: 'center', color: PALETTE.copperBright });
  }
}

function wrapLines(ctx, text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const word of words) {
    const trial = line ? `${line} ${word}` : word;
    if (ctx.measureText(trial).width <= maxWidth || line === '') {
      line = trial;
    } else {
      lines.push(line);
      line = word;
    }
  }
  if (line !== '') lines.push(line);
  return lines;
}

// Grid mini Ledger untuk layar gabungan (Fase 2): 24 sel ikon saja —
// owned menyala dengan bingkai emas, undiscovered gelap dengan "?".
// Nama lengkap relic tampil di layar Ledger, bukan di grid mini ini.
function drawLedgerMiniGrid(ctx, state, x0, y0) {
  const owned = state.ledger ? state.ledger.relics : [];
  const cell = 52;
  const gap = 8;
  Object.values(RELICS).forEach((relic, i) => {
    const col = i % 6;
    const row = Math.floor(i / 6);
    const x = x0 + col * (cell + gap);
    const y = y0 + row * (cell + gap);
    drawPanel(ctx, x, y, cell, cell, 8);
    const cx = x + cell / 2;
    const cy = y + cell / 2;
    drawRelicIcon(ctx, relic.id, cx, cy, 16);
    if (owned.includes(relic.id)) {
      ctx.strokeStyle = PALETTE.copperBright;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(x + 1, y + 1, cell - 2, cell - 2, 8);
      ctx.stroke();
    } else {
      ctx.fillStyle = 'rgba(15,10,6,0.85)';
      ctx.beginPath();
      ctx.roundRect(x, y, cell, cell, 8);
      ctx.fill();
      drawText(ctx, '?', cx, cy + 7, { font: '20px Georgia, serif', align: 'center', color: PALETTE.creamDim });
    }
  });
}

// Roster regular untuk layar gabungan (Fase 2): baris potret + nama
// lengkap + ikon favorit + jumlah kunjungan + titik mood.
function drawRegularsRoster(ctx, state, x0, y0, width) {
  PATRONS.forEach((patron, i) => {
    const y = y0 + i * 26;
    const cy = y + 11;
    drawSilhouette(ctx, x0 + 13, cy, 11, patron.accent);
    const record = state.ledger ? state.ledger.regulars[patron.id] : null;
    const visits = record ? record.visits : 0;
    const mood = moodFor(record);
    drawText(ctx, patron.name, x0 + 30, y + 19, {
      font: '20px Georgia, serif',
      color: visits > 0 ? PALETTE.cream : PALETTE.creamDim,
    });
    drawElementGlyph(ctx, ELEMENT_BY_ID[patron.favorite], x0 + width - 64, cy, 10);
    drawText(ctx, `x${visits}`, x0 + width - 44, y + 19, { font: '20px Georgia, serif', color: PALETTE.creamDim });
    ctx.fillStyle = moodColor(mood);
    ctx.beginPath();
    ctx.arc(x0 + width - 8, cy, 6, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawDayResult(ctx, state) {
  clearScreen(ctx, 1280, 720);
  const stats = state.dayStats || { served: 0, lost: 0 };
  drawText(ctx, `DAY ${state.day} COMPLETE`, 640, 110, {
    font: '48px Georgia, serif',
    align: 'center',
    color: PALETTE.copperBright,
  });
  drawText(
    ctx,
    `Served ${stats.served}   Walked out ${stats.lost}   Score ${state.score}   Coins ${state.coins}   Hearts ${heartsLine(state.hearts, 5)}`,
    640,
    160,
    {
      font: '22px Georgia, serif',
      align: 'center',
    },
  );
  if (stats.perfect) {
    drawText(ctx, `Perfect day! +${stats.perfectScore || 50} score, +10 coins.`, 640, 196, {
      font: '20px Georgia, serif',
      align: 'center',
      color: PALETTE.ok,
    });
  }
  // Kolom kiri: grid Ledger + roster regular (layar gabungan Fase 2).
  drawText(ctx, `THE LEDGER ${ledgerCount(state.ledger)}/${LEDGER_SIZE}`, 40, 232, {
    font: '22px Georgia, serif',
    color: PALETTE.copperBright,
  });
  drawLedgerMiniGrid(ctx, state, 40, 246);
  drawText(ctx, 'REGULARS', 40, 512, { font: '22px Georgia, serif', color: PALETTE.copperBright });
  drawRegularsRoster(ctx, state, 40, 524, 364);
  drawText(ctx, 'SHOP — click a card to buy, or press 1 / 2 / 3', 841, 228, {
    font: '20px Georgia, serif',
    align: 'center',
    color: PALETTE.creamDim,
  });
  (state.shopOffers || []).forEach((offer, i) => {
    const rect = shopCardRect(i);
    drawPanel(ctx, rect.x, rect.y, rect.w, rect.h, 12);
    if (offer.sold) {
      drawText(ctx, 'SOLD', rect.x + rect.w / 2, rect.y + 130, {
        font: '28px Georgia, serif',
        align: 'center',
        color: PALETTE.creamDim,
      });
      return;
    }
    drawText(ctx, offerTitle(offer), rect.x + rect.w / 2, rect.y + 56, {
      font: '26px Georgia, serif',
      align: 'center',
    });
    ctx.font = '20px Georgia, serif';
    const lines = wrapLines(ctx, offerText(offer), rect.w - 24);
    lines.slice(0, 3).forEach((line, li) => {
      drawText(ctx, line, rect.x + rect.w / 2, rect.y + 96 + li * 26 - (lines.length - 1) * 8, {
        font: '20px Georgia, serif',
        align: 'center',
        color: PALETTE.creamDim,
      });
    });
    const iconX = rect.x + rect.w / 2;
    if (offer.kind === 'reagent') drawElementGlyph(ctx, ELEMENT_BY_ID[offer.id], iconX, rect.y + 152, 22);
    else if (offer.kind === 'utility') drawUtilityGlyph(ctx, offer.id, iconX, rect.y + 152, 22);
    else drawRelicIcon(ctx, offer.id, iconX, rect.y + 152, 22);
    drawText(ctx, `${offer.price} coins  [${i + 1}]`, rect.x + rect.w / 2, rect.y + 200, {
      font: '22px Georgia, serif',
      align: 'center',
      color: offer.price <= state.coins ? PALETTE.copperBright : PALETTE.danger,
    });
  });
  drawButton(ctx, LAYOUT.continueButton, 'CONTINUE', { fill: '#6b4423' });
}

function drawWin(ctx, state) {
  clearScreen(ctx, 1280, 720);
  drawText(ctx, 'YOU WIN', 640, 150, { font: '64px Georgia, serif', align: 'center', color: PALETTE.copperBright });
  drawText(ctx, 'All 10 shifts served. The night market remembers your name.', 640, 200, {
    font: '22px Georgia, serif',
    align: 'center',
  });
  drawText(ctx, `Final score: ${state.score}`, 640, 300, { font: '28px Georgia, serif', align: 'center' });
  drawText(ctx, `Rank: ${rankFor(state.score)}`, 640, 360, { font: '44px Georgia, serif', align: 'center' });
  drawText(ctx, `Best score: ${state.bestScore}`, 640, 420, { font: '20px Georgia, serif', align: 'center', color: PALETTE.creamDim });
  drawOrnamentRow(ctx, ELEMENTS, 640, 472, 14);
  drawButton(ctx, LAYOUT.playAgainButton, 'PLAY AGAIN', { fill: '#6b4423' });
  // Footer LEDGER UPDATED (Fase 2): apa yang run ini tambahkan ke Ledger.
  const newRelics = state.runNewRelics || [];
  const visits = state.runRegularVisits || 0;
  const newRegulars = state.runNewRegulars || [];
  const detail = newRelics.length === 0 && visits === 0 && newRegulars.length === 0
    ? 'No new entries this run.'
    : `+${newRelics.length} relic${newRelics.length === 1 ? '' : 's'} · ${visits} regular visit${visits === 1 ? '' : 's'} · ${newRegulars.length} new regular${newRegulars.length === 1 ? '' : 's'}`;
  drawText(ctx, 'LEDGER UPDATED', 640, 624, { font: '20px Georgia, serif', align: 'center', color: PALETTE.copperBright });
  drawText(ctx, detail, 640, 650, { font: '20px Georgia, serif', align: 'center', color: PALETTE.creamDim });
}

// Layar Ledger (Fase 2): grid 24 relic — owned menyala, undiscovered
// siluet gelap dengan "?", nama selalu tampil. Roster regular tampil di
// layar gabungan dayResult; layar ini fokus pada koleksi.
function drawLedger(ctx, state) {
  clearScreen(ctx, 1280, 720);
  const owned = state.ledger ? state.ledger.relics : [];
  drawText(ctx, 'THE LEDGER', 640, 84, { font: '48px Georgia, serif', align: 'center', color: PALETTE.copperBright });
  drawText(ctx, `Relics found: ${owned.length}/${LEDGER_SIZE} — new finds open new shop stock in later runs.`, 640, 118, {
    font: '20px Georgia, serif',
    align: 'center',
    color: PALETTE.creamDim,
  });
  const cellW = 160;
  const cellH = 104;
  const gap = 14;
  const x0 = (1280 - (6 * cellW + 5 * gap)) / 2;
  const y0 = 140;
  Object.values(RELICS).forEach((relic, i) => {
    const col = i % 6;
    const row = Math.floor(i / 6);
    const x = x0 + col * (cellW + gap);
    const y = y0 + row * (cellH + gap);
    drawPanel(ctx, x, y, cellW, cellH, 10);
    const cx = x + cellW / 2;
    drawRelicIcon(ctx, relic.id, cx, y + 38, 22);
    if (owned.includes(relic.id)) {
      ctx.strokeStyle = PALETTE.copperBright;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(x + 1, y + 1, cellW - 2, cellH - 2, 10);
      ctx.stroke();
      drawText(ctx, relic.name, cx, y + 88, { font: '20px Georgia, serif', align: 'center' });
    } else {
      ctx.fillStyle = 'rgba(15,10,6,0.85)';
      ctx.beginPath();
      ctx.roundRect(x, y, cellW, cellH - 28, 10);
      ctx.fill();
      drawText(ctx, '?', cx, y + 45, { font: '20px Georgia, serif', align: 'center', color: PALETTE.creamDim });
      drawText(ctx, relic.name, cx, y + 88, { font: '20px Georgia, serif', align: 'center', color: PALETTE.creamDim });
    }
  });
  drawButton(ctx, LAYOUT.backButton, 'BACK', { fill: '#3a2a1c', font: '20px Georgia, serif' });
}

function drawGameOver(ctx, state) {
  clearScreen(ctx, 1280, 720);
  drawText(ctx, 'GAME OVER', 640, 150, { font: '64px Georgia, serif', align: 'center', color: PALETTE.danger });
  drawText(ctx, state.loseCause || 'The queue boiled over.', 640, 210, {
    font: '22px Georgia, serif',
    align: 'center',
  });
  drawText(ctx, `Score: ${state.score}   Day reached: ${state.day}/10`, 640, 300, {
    font: '26px Georgia, serif',
    align: 'center',
  });
  drawText(ctx, `Best score: ${state.bestScore}`, 640, 350, { font: '20px Georgia, serif', align: 'center', color: PALETTE.creamDim });
  drawOrnamentRow(ctx, ELEMENTS, 640, 440, 14);
  drawButton(ctx, LAYOUT.playAgainButton, 'PLAY AGAIN', { fill: '#6b4423' });
}

function drawPauseOverlay(ctx) {
  ctx.fillStyle = 'rgba(10, 6, 3, 0.72)';
  ctx.fillRect(0, 0, 1280, 720);
  drawText(ctx, 'PAUSED', 640, 300, { font: '56px Georgia, serif', align: 'center' });
  drawText(ctx, 'Press P to resume', 640, 350, { font: '22px Georgia, serif', align: 'center', color: PALETTE.creamDim });
  drawButton(ctx, LAYOUT.resumeButton, 'RESUME', { fill: '#6b4423' });
}

export function drawScreen(ctx, state) {
  if (state.screen === 'title') drawTitle(ctx, state);
  else if (state.screen === 'ledger') drawLedger(ctx, state);
  else if (state.screen === 'dayIntro') drawDayIntro(ctx, state);
  else if (state.screen === 'play') drawPlay(ctx, state);
  else if (state.screen === 'dayResult') drawDayResult(ctx, state);
  else if (state.screen === 'win') drawWin(ctx, state);
  else if (state.screen === 'gameover') drawGameOver(ctx, state);
  drawVignette(ctx, 1280, 720);
  if (state.paused && state.screen === 'play') drawPauseOverlay(ctx);
}

// ---- Tambahan HUD Fase B (di bawah deklarasi yang sudah ada) ----

// B3: strip progres 10 hari — 10 pip bertint tema harinya; hari selesai
// terisi, hari berjalan bercahaya, hari depan berongga. Tanpa teks/angka
// kecil: maknanya dibaca dari posisi pip + DAY x/10 di atasnya.
function drawDayStrip(ctx, state) {
  const x0 = 16;
  const y = 58;
  const w = 248;
  const h = 30;
  ctx.fillStyle = 'rgba(20,13,8,0.6)';
  ctx.strokeStyle = 'rgba(196,123,58,0.5)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(x0, y, w, h, 15);
  ctx.fill();
  ctx.stroke();
  const time = state.animTime || 0;
  for (let d = 1; d <= 10; d += 1) {
    const cx = x0 + 16 + (d - 1) * 24;
    const cy = y + h / 2;
    const theme = effectiveThemeFor(d, state.dailyMarket);
    if (d < state.day) {
      ctx.fillStyle = theme.hudTint;
      ctx.beginPath();
      ctx.arc(cx, cy, 8, 0, Math.PI * 2);
      ctx.fill();
    } else if (d === state.day) {
      const pulse = 0.7 + 0.3 * Math.sin(time * 3);
      ctx.save();
      ctx.shadowColor = theme.hudTint;
      ctx.shadowBlur = 10;
      ctx.fillStyle = theme.hudTint;
      ctx.globalAlpha = pulse;
      ctx.beginPath();
      ctx.arc(cx, cy, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      ctx.fillStyle = '#1d130b';
      ctx.beginPath();
      ctx.arc(cx, cy, 3.5, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.strokeStyle = theme.hudTint;
      ctx.globalAlpha = 0.55;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, 8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }
}

// B4: chip objektif — syarat WIN dan LOSE eksplisit, kiri tengah.
function drawObjectiveChip(ctx) {
  ctx.font = '20px Georgia, serif';
  const winLine = 'WIN: clear the Day 10 quota';
  const loseLine = 'LOSE: 0 hearts left';
  const w = Math.max(ctx.measureText(winLine).width, ctx.measureText(loseLine).width) + 28;
  const x = 56;
  const y = 258;
  const h = 68;
  drawPanel(ctx, x, y, w, h, 10);
  drawText(ctx, winLine, x + 14, y + 28, { font: '20px Georgia, serif', color: PALETTE.ok });
  drawText(ctx, loseLine, x + 14, y + 56, { font: '20px Georgia, serif', color: PALETTE.danger });
}

// B1: relic yang dimiliki — tumpukan vertikal ikon + nama di kiri bawah,
// tidak digambar bila belum ada relic. Vertikal (bukan baris horizontal)
// agar tidak pernah bertabrakan dengan tangan, notice, atau FROZEN.
function drawRelicStack(ctx, state) {
  const owned = state.ownedRelics || [];
  if (owned.length === 0) return;
  ctx.font = '20px Georgia, serif';
  let nameW = 0;
  for (const id of owned) nameW = Math.max(nameW, ctx.measureText(RELICS[id].name).width);
  const w = 56 + nameW;
  const h = owned.length * 32 + 16;
  const x = 52;
  const y = 646 - h;
  drawPanel(ctx, x, y, w, h, 10);
  owned.forEach((id, i) => {
    const cy = y + 16 + i * 32 + 8;
    drawRelicIcon(ctx, id, x + 24, cy, 11);
    drawText(ctx, RELICS[id].name, x + 44, cy + 7, { font: '20px Georgia, serif' });
  });
}

// B2: hitungan deck/discard — pil di kanan bawah, cerminan relic stack.
function drawDeckCounts(ctx, state) {
  ctx.font = '20px Georgia, serif';
  const text = `Deck ${(state.deck || []).length} · Discard ${(state.discard || []).length}`;
  const w = ctx.measureText(text).width + 32;
  const h = 34;
  const x = 1256 - w;
  const y = 612;
  drawPanel(ctx, x, y, w, h, 17);
  drawText(ctx, text, x + w / 2, y + 23, { font: '20px Georgia, serif', align: 'center' });
}
