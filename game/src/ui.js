// ui.js — HUD, menu, dan semua layar. Satu-satunya file yang menggambar
// teks layar penuh. LAYOUT adalah sumber tunggal koordinat tombol, dipakai
// juga oleh main.js untuk hit-test klik.

import {
  ELEMENTS,
  ELEMENT_BY_ID,
  PLAY_CONTROLS_LINE,
  RELICS,
  TITLE_CONTROLS,
  UTILITIES,
  dayConfig,
  deckComposition,
  generateRecipe,
  makeRng,
  offerText,
  offerTitle,
  rankFor,
} from './rules.js';
import {
  PALETTE,
  SILHOUETTE_ACCENTS,
  clearScreen,
  drawBackground,
  drawButton,
  drawCardFrame,
  drawCauldronBlobs,
  drawCauldronHalo,
  drawCauldronLiquid,
  drawCustomerPortrait,
  drawElementGlyph,
  drawGlyphEmbossed,
  drawOrnamentRow,
  drawPanel,
  drawRelicIcon,
  drawSilhouette,
  drawSteam,
  drawText,
  drawUtilityGlyph,
  drawVignette,
  mixElementColors,
  pointInRect,
  themeFor,
} from './render.js';

export const LAYOUT = {
  startButton: { x: 490, y: 556, w: 300, h: 64 },
  beginButton: { x: 490, y: 520, w: 300, h: 60 },
  continueButton: { x: 490, y: 612, w: 300, h: 56 },
  playAgainButton: { x: 490, y: 520, w: 300, h: 64 },
  resumeButton: { x: 490, y: 420, w: 300, h: 56 },
};

export function shopCardRect(index) {
  return { x: 140 + index * 340, y: 250, w: 300, h: 260 };
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

function drawTitle(ctx, state) {
  clearScreen(ctx, 1280, 720);
  drawTitleDemo(ctx, state);
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
    drawCustomerPortrait(ctx, customer, x + 40, y + 40, 22, SILHOUETTE_ACCENTS[customer.id % SILHOUETTE_ACCENTS.length]);
    ctx.strokeStyle = patienceColor(fraction);
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(x + 40, y + 40, 26, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * fraction);
    ctx.stroke();
    const tag = customer.critic ? 'CRITIC' : customer.purist ? 'PURIST' : 'GUEST';
    drawText(ctx, tag, x + 80, y + 36, { font: '20px Georgia, serif', color: PALETTE.copperBright });
    drawText(ctx, `${Math.ceil(customer.patience)}s`, x + 80, y + 62, {
      font: '20px Georgia, serif',
      color: patienceColor(fraction),
    });
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
  const theme = themeFor(state.day);
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
    drawText(ctx, 'Perfect day! +50 score, +10 coins.', 640, 196, {
      font: '20px Georgia, serif',
      align: 'center',
      color: PALETTE.ok,
    });
  }
  drawText(ctx, 'SHOP — click a card to buy, or press 1 / 2 / 3', 640, 228, {
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
    const theme = themeFor(d);
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

// ---- Demo autoplay di belakang title (Fase D, di bawah deklarasi lama) ----
// Adegan demo adalah fungsi MURNI dari waktu (state.animTime): antrean,
// kauldron, dan tangan dibuat ulang tiap frame dari RNG demo yang dibuat
// segar per siklus — TIDAK PERNAH menyentuh state.rng, state.visualRng,
// atau field permainan apa pun. Demo digambar SANGAT redup (alpha 0,18 +
// overlay gelap 0,65) di bawah konten title yang tidak berubah.

const DEMO_SEED = 987654321;
const DEMO_CYCLE_SEC = 12;
const DEMO_ELEMENTS = ['cinnabar', 'moonwell', 'thornroot', 'hivegold', 'gloomcap', 'saltstar'];

function demoStateFor(time) {
  const phase = ((time % DEMO_CYCLE_SEC) + DEMO_CYCLE_SEC) % DEMO_CYCLE_SEC;
  const cycle = Math.floor(time / DEMO_CYCLE_SEC);
  const queue = [0, 1, 2].map((i) => {
    const rng = makeRng((DEMO_SEED + cycle * 131 + i * 17) >>> 0);
    const maxPatience = 28;
    const frac = 1 - ((phase + i * 3.1) % DEMO_CYCLE_SEC) / DEMO_CYCLE_SEC;
    return {
      id: 900 + i,
      recipe: generateRecipe(8, rng),
      patience: Math.max(1, maxPatience * frac),
      maxPatience,
      critic: i === 2,
      purist: i === 1,
      warned: frac < 0.25,
    };
  });
  const half = phase % 6;
  const brewRng = makeRng((DEMO_SEED + cycle * 131 + 7) >>> 0);
  const brew = generateRecipe(8, brewRng);
  brew.push(DEMO_ELEMENTS[Math.floor(brewRng() * DEMO_ELEMENTS.length)]);
  const filled = half < 4.8 ? Math.floor(half / 1.2) : 4;
  const slots = [null, null, null, null];
  for (let i = 0; i < filled; i += 1) slots[i] = brew[i];
  const handRng = makeRng((DEMO_SEED + cycle * 131 + 3) >>> 0);
  const hand = [];
  for (let i = 0; i < 5; i += 1) {
    hand.push(handRng() < 0.2 ? 'stir' : DEMO_ELEMENTS[Math.floor(handRng() * DEMO_ELEMENTS.length)]);
  }
  return {
    day: 8,
    animTime: time,
    queue,
    cauldron: { slots, catalyst: DEMO_ELEMENTS[((cycle % DEMO_ELEMENTS.length) + DEMO_ELEMENTS.length) % DEMO_ELEMENTS.length] },
    hand,
    selected: null,
    mouse: null,
    targetId: queue[0].id,
    rejectFlash: 0,
  };
}

// Kilat sajian demo: cincin mengembang + 8 sinar, fungsi murni waktu.
// Aktif 0,8 detik di ujung tiap setengah siklus (saat brew "disajikan").
function drawDemoFlash(ctx, time) {
  const half = ((time % 6) + 6) % 6;
  if (half < 5.2) return;
  const p = (half - 5.2) / 0.8;
  const radius = 40 + p * 130;
  ctx.save();
  ctx.globalAlpha = 0.8 * (1 - p);
  ctx.strokeStyle = '#e8a558';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(640, 400, radius, 0, Math.PI * 2);
  ctx.stroke();
  for (let i = 0; i < 8; i += 1) {
    const a = (i * Math.PI) / 4;
    ctx.beginPath();
    ctx.moveTo(640 + Math.cos(a) * (radius - 14), 400 + Math.sin(a) * (radius - 14));
    ctx.lineTo(640 + Math.cos(a) * (radius + 14), 400 + Math.sin(a) * (radius + 14));
    ctx.stroke();
  }
  ctx.restore();
}

function drawTitleDemo(ctx, state) {
  const time = state.animTime || 0;
  const demo = demoStateFor(time);
  ctx.save();
  ctx.globalAlpha = 0.18;
  drawBackground(ctx, demo);
  drawCustomers(ctx, demo);
  drawCauldron(ctx, demo);
  drawHand(ctx, demo);
  drawDemoFlash(ctx, time);
  ctx.restore();
  ctx.fillStyle = 'rgba(15,10,6,0.65)';
  ctx.fillRect(0, 0, 1280, 720);
}
