// ui.js — HUD, menu, dan semua layar. Satu-satunya file yang menggambar
// teks layar penuh. LAYOUT adalah sumber tunggal koordinat tombol, dipakai
// juga oleh main.js untuk hit-test klik.

import {
  ELEMENT_BY_ID,
  PLAY_CONTROLS_LINE,
  TITLE_CONTROLS,
  UTILITIES,
  dayConfig,
  offerText,
  offerTitle,
  rankFor,
} from './rules.js';
import {
  PALETTE,
  clearScreen,
  drawButton,
  drawElementDisc,
  drawPanel,
  drawText,
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
  const x = 640 - ((handLength - 1) * 122) / 2 + index * 122;
  return { x: x - 52, y: 520, w: 104, h: 130 };
}

export function cauldronSlotRect(slotCount, index) {
  const x = 640 - ((slotCount - 1) * 62) / 2 + index * 62;
  return { x: x - 26, y: 374, w: 52, h: 52 };
}

export const CATALYST_RECT = { x: 790, y: 370, w: 120, h: 60 };

export function customerRect(index) {
  return { x: 160 + index * 300, y: 96, w: 260, h: 150 };
}

function heartsLine(hearts, max) {
  let line = '';
  for (let i = 0; i < max; i += 1) line += i < hearts ? '♥ ' : '♡ ';
  return line.trim();
}

function drawTitle(ctx, state) {
  clearScreen(ctx, 1280, 720);
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
    const base = customerRect(i);
    const x = base.x + (state.targetId === customer.id ? shake : 0);
    const y = base.y;
    drawPanel(ctx, x, y, 260, 150, 12);
    const fraction = customer.maxPatience > 0 ? customer.patience / customer.maxPatience : 0;
    ctx.strokeStyle = patienceColor(fraction);
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(x + 40, y + 40, 26, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * fraction);
    ctx.stroke();
    drawText(ctx, '◉', x + 40, y + 48, { font: '24px Georgia, serif', align: 'center' });
    const tag = customer.critic ? 'CRITIC' : customer.purist ? 'PURIST' : 'GUEST';
    drawText(ctx, tag, x + 80, y + 36, { font: '20px Georgia, serif', color: PALETTE.copperBright });
    drawText(ctx, `${Math.ceil(customer.patience)}s`, x + 80, y + 62, { font: '20px Georgia, serif' });
    if (state.targetId === customer.id) {
      ctx.strokeStyle = PALETTE.copperBright;
      ctx.lineWidth = 3;
      ctx.strokeRect(x - 4, y - 4, 268, 158);
    }
    customer.recipe.forEach((elId, j) => {
      drawElementDisc(ctx, ELEMENT_BY_ID[elId], x + 34 + j * 52, y + 108, 20);
    });
  });
}

function drawCauldron(ctx, state) {
  const shake = state.rejectFlash > 0 ? Math.sin(state.rejectFlash * 30) * 5 : 0;
  const cx = 640 + shake;
  const cy = 400;
  ctx.fillStyle = '#0f0a06';
  ctx.beginPath();
  ctx.arc(cx, cy, 86, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = PALETTE.copper;
  ctx.lineWidth = 4;
  ctx.stroke();
  drawText(ctx, 'CAULDRON', cx, cy - 96, { font: '20px Georgia, serif', align: 'center', color: PALETTE.creamDim });
  const slots = state.cauldron ? state.cauldron.slots : [];
  slots.forEach((cardId, i) => {
    const rect = cauldronSlotRect(slots.length, i);
    drawPanel(ctx, rect.x + shake, rect.y, rect.w, rect.h, 8);
    if (cardId) drawElementDisc(ctx, ELEMENT_BY_ID[cardId], rect.x + shake + 26, cy, 20);
  });
  drawPanel(ctx, CATALYST_RECT.x, CATALYST_RECT.y, CATALYST_RECT.w, CATALYST_RECT.h, 8);
  drawText(ctx, 'CATALYST', CATALYST_RECT.x + CATALYST_RECT.w / 2, CATALYST_RECT.y - 10, { font: '20px Georgia, serif', align: 'center', color: PALETTE.creamDim });
  if (state.cauldron && state.cauldron.catalyst) {
    drawElementDisc(ctx, ELEMENT_BY_ID[state.cauldron.catalyst], CATALYST_RECT.x + CATALYST_RECT.w / 2, cy, 20);
  }
}

function drawHand(ctx, state) {
  const hand = state.hand || [];
  hand.forEach((cardId, i) => {
    const rect = handCardRect(hand.length, i);
    const x = rect.x + rect.w / 2;
    const y = rect.y;
    drawPanel(ctx, rect.x, rect.y, rect.w, rect.h, 10);
    if (state.selected === i) {
      ctx.strokeStyle = PALETTE.copperBright;
      ctx.lineWidth = 3;
      ctx.strokeRect(x - 56, y - 4, 112, 138);
    }
    if (ELEMENT_BY_ID[cardId]) {
      drawElementDisc(ctx, ELEMENT_BY_ID[cardId], x, y + 46, 26);
      drawText(ctx, ELEMENT_BY_ID[cardId].name, x, y + 104, { font: '20px Georgia, serif', align: 'center' });
    } else if (UTILITIES[cardId]) {
      drawText(ctx, UTILITIES[cardId].name, x, y + 56, { font: '22px Georgia, serif', align: 'center' });
      drawText(ctx, 'utility', x, y + 86, { font: '20px Georgia, serif', align: 'center', color: PALETTE.creamDim });
    }
  });
}

function drawPlay(ctx, state) {
  clearScreen(ctx, 1280, 720);
  const cfg = dayConfig(state.day);
  drawText(ctx, `DAY ${state.day}/10`, 24, 40, { font: '22px Georgia, serif' });
  drawText(ctx, `Served ${state.servedToday}/${cfg.quota}`, 170, 40, { font: '22px Georgia, serif' });
  drawText(ctx, `SCORE ${state.score}`, 360, 40, { font: '22px Georgia, serif' });
  drawText(ctx, `COINS ${state.coins}`, 540, 40, { font: '22px Georgia, serif' });
  drawText(ctx, heartsLine(state.hearts, 5), 700, 40, { font: '22px Georgia, serif', color: PALETTE.danger });
  drawText(ctx, `COMBO x${state.combo}`, 900, 40, { font: '22px Georgia, serif' });
  drawText(ctx, state.audio && state.audio.muted ? 'M: MUTED' : 'M: SOUND', 1100, 40, { font: '22px Georgia, serif' });
  drawCustomers(ctx, state);
  drawCauldron(ctx, state);
  drawHand(ctx, state);
  drawText(ctx, PLAY_CONTROLS_LINE, 640, 700, { font: '20px Georgia, serif', align: 'center', color: PALETTE.creamDim });
  if (state.notice && state.noticeLeft > 0) {
    drawText(ctx, state.notice, 640, 80, { font: '22px Georgia, serif', align: 'center', color: PALETTE.copperBright });
  }
}

function drawDayResult(ctx, state) {
  clearScreen(ctx, 1280, 720);
  const stats = state.dayStats || { served: 0, lost: 0 };
  drawText(ctx, `DAY ${state.day} COMPLETE`, 640, 110, {
    font: '48px Georgia, serif',
    align: 'center',
    color: PALETTE.copperBright,
  });
  drawText(ctx, `Served ${stats.served}   Walked out ${stats.lost}   Score ${state.score}   Coins ${state.coins}`, 640, 160, {
    font: '22px Georgia, serif',
    align: 'center',
  });
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
    drawText(ctx, offerText(offer), rect.x + rect.w / 2, rect.y + 96, {
      font: '20px Georgia, serif',
      align: 'center',
      color: PALETTE.creamDim,
    });
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
  if (state.paused && state.screen === 'play') drawPauseOverlay(ctx);
}
