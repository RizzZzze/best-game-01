// main.js — bootstrap + state machine Alembic Rush.
// Alur state: title -> dayIntro -> play -> dayResult (shop) -> dayIntro
// berikutnya ... -> win (kuota hari 10 tuntas) atau gameover (hati habis).
// Semua jalur restart memulai run baru hari 1. Pause adalah overlay di atas
// play dan membekukan update. File ini tidak menggambar sendiri: render
// didelegasikan ke ui.js, input ke input.js, audio ke audio.js.
//
// Putusan HQ yang dikunci di state machine ini:
// HQ-1: koreografi klik (pilih -> taruh / klik 2x auto-place) dijelaskan
//   lengkap di title screen (TITLE_CONTROLS di rules.js); baris kontrol play
//   verbatim brief. Implementasi klik play menyusul di fase 2.
// HQ-2: combo naik SEBELUM pengali (lihat serveScore di rules.js).
// HQ-3: walk-out mereset combo (penanganan di update()).
// HQ-4: X dump mereset combo, Purge tidak (resolusi di fase 2).
// HQ-5: kritik = koin x2 saja, slot kedatangan tetap (planCriticSlots).
// HQ-6: Purist + Strange ditolak tanpa mengubah state (isRejectedServe).

import {
  ELEMENT_BY_ID,
  GAME_HEIGHT,
  GAME_WIDTH,
  MAX_HEARTS,
  SPAWN_INTERVAL_SEC,
  START_HEARTS,
  TOTAL_DAYS,
  cauldronSlotCount,
  dayConfig,
  generateShopOffers,
  makeRng,
  newlyUnlocked,
  planCriticSlots,
  plannedArrivals,
} from './rules.js';
import { buildDeck, drawUp } from './deck.js';
import { createCauldron } from './cauldron.js';
import { resetCustomerIds, spawnNext, tickQueue } from './customers.js';
import { bindInput } from './input.js';
import { AudioEngine } from './audio.js';
import { ParticleSystem } from './particles.js';
import { LAYOUT, drawScreen, shopCardRect } from './ui.js';
import { pointInRect } from './render.js';

const BEST_KEY = 'alembic-rush-best';

export function loadBestScore() {
  try {
    if (typeof localStorage === 'undefined') return 0;
    return Number(localStorage.getItem(BEST_KEY) || 0) || 0;
  } catch {
    return 0;
  }
}

export function saveBestScore(score) {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(BEST_KEY, String(score));
  } catch {
    // Penyimpanan tidak tersedia (konteks sandbox): best score sesi saja.
  }
}

export function introNotesFor(day) {
  const notes = [];
  if (day === 1) {
    notes.push('Match the recipe exactly, then brew with Space.');
  }
  for (const id of newlyUnlocked(day)) {
    notes.push(`${ELEMENT_BY_ID[id].name} unlocked and added to the deck (3 copies).`);
  }
  if (day === 5) notes.push('Critics arrive: half patience, double coins.');
  if (day === 6) notes.push('Extra Slot relic is now sold in the shop.');
  if (day === 7) notes.push('Purists arrive: +25% coins, but they refuse Strange brews.');
  return notes;
}

export function createState(seed = 1) {
  const state = {
    screen: 'title',
    paused: false,
    seed: seed >>> 0,
    rng: makeRng(seed),
    bestScore: loadBestScore(),
    audio: new AudioEngine(),
    particles: new ParticleSystem(),
    day: 1,
    score: 0,
    coins: 0,
    hearts: START_HEARTS,
    combo: 0,
    servedToday: 0,
    lostToday: 0,
    deck: [],
    hand: [],
    discard: [],
    extraCards: [],
    ownedRelics: [],
    cauldron: createCauldron(4),
    queue: [],
    arrivalsSpawned: 0,
    arrivalsPlanned: 0,
    criticSlots: [],
    spawnTimer: 0,
    selected: null,
    targetId: null,
    freezeLeft: 0,
    shopOffers: [],
    dayStats: null,
    introNotes: [],
    loseCause: '',
    notice: null,
  };
  return state;
}

// Mulai run baru hari 1. Seed maju tiap restart agar run berikutnya berbeda.
export function startNewRun(state, seed = null) {
  const nextSeed = seed === null ? (state.seed + 7919) >>> 0 : seed >>> 0;
  state.seed = nextSeed;
  state.rng = makeRng(nextSeed);
  state.screen = 'dayIntro';
  state.paused = false;
  state.day = 1;
  state.score = 0;
  state.coins = 0;
  state.hearts = START_HEARTS;
  state.combo = 0;
  state.extraCards = [];
  state.ownedRelics = [];
  state.deck = [];
  state.hand = [];
  state.discard = [];
  state.queue = [];
  state.shopOffers = [];
  state.dayStats = null;
  state.loseCause = '';
  state.notice = null;
  state.introNotes = introNotesFor(1);
  resetCustomerIds();
  state.particles.clear();
  return state;
}

// Siapkan hari: deck dikocok, tangan ditarik, kauldron kosong, antrean awal.
export function beginDay(state) {
  const cfg = dayConfig(state.day);
  state.deck = buildDeck(state.day, state.extraCards, state.rng);
  state.hand = [];
  state.discard = [];
  drawUp(state.hand, state.deck, state.discard, state.rng);
  state.cauldron = createCauldron(cauldronSlotCount(state.ownedRelics));
  state.queue = [];
  state.arrivalsSpawned = 0;
  state.arrivalsPlanned = plannedArrivals(state.day);
  state.criticSlots = planCriticSlots(state.day, state.rng);
  state.spawnTimer = 0;
  state.servedToday = 0;
  state.lostToday = 0;
  state.selected = null;
  state.targetId = null;
  state.freezeLeft = 0;
  state.notice = null;
  const initial = Math.min(2, cfg.queueMax);
  for (let i = 0; i < initial; i += 1) {
    spawnNext(state.queue, state.day, state.rng, state.arrivalsSpawned, state.criticSlots);
    state.arrivalsSpawned += 1;
  }
  state.screen = 'play';
  state.paused = false;
  return state;
}

function updateBest(state) {
  if (state.score > state.bestScore) {
    state.bestScore = state.score;
    saveBestScore(state.bestScore);
  }
}

// Kuota hari tercapai: bonus hari sempurna, lalu shop atau win.
export function finishDay(state) {
  const perfect = state.lostToday === 0;
  if (perfect) {
    state.score += 50;
    state.coins += 10;
  }
  state.dayStats = { served: state.servedToday, lost: state.lostToday, perfect };
  if (state.day >= TOTAL_DAYS) {
    state.screen = 'win';
    updateBest(state);
    return state;
  }
  state.shopOffers = generateShopOffers(state.day + 1, state.ownedRelics, state.rng);
  state.screen = 'dayResult';
  return state;
}

export function continueFromResults(state) {
  state.day += 1;
  state.introNotes = introNotesFor(state.day);
  state.screen = 'dayIntro';
  return state;
}

export function loseRun(state, cause) {
  state.screen = 'gameover';
  state.paused = false;
  state.loseCause = cause;
  updateBest(state);
  return state;
}

export function togglePause(state) {
  if (state.screen !== 'play') return state;
  state.paused = !state.paused;
  return state;
}

export function toggleMute(state) {
  state.audio.toggleMute();
  return state;
}

export function buyOffer(state, index) {
  const offer = state.shopOffers[index];
  if (!offer || offer.sold) return { ok: false, reason: 'unavailable' };
  if (state.coins < offer.price) return { ok: false, reason: 'not-enough-coins' };
  state.coins -= offer.price;
  offer.sold = true;
  if (offer.kind === 'reagent' || offer.kind === 'utility') {
    state.extraCards.push(offer.id);
  } else if (offer.kind === 'relic') {
    state.ownedRelics.push(offer.id);
  }
  return { ok: true };
}

// Satu langkah simulasi. Dipanggil tiap frame dari loop browser; bisa juga
// dipanggil langsung dari tes headless.
export function update(state, dt) {
  if (state.paused) return state;
  if (state.screen !== 'play') return state;
  if (state.freezeLeft > 0) {
    state.freezeLeft = Math.max(0, state.freezeLeft - dt);
  }
  const frozen = state.freezeLeft > 0;
  const walkouts = tickQueue(state.queue, dt, frozen, state.ownedRelics.includes('bell'));
  for (const gone of walkouts) {
    state.hearts -= 1;
    state.combo = 0; // HQ-3: walk-out mereset combo.
    state.lostToday += 1;
    if (state.targetId === gone.id) state.targetId = null;
  }
  if (state.hearts <= 0) {
    state.hearts = 0;
    return loseRun(state, 'All five hearts lost — the queue boiled over.');
  }
  const cfg = dayConfig(state.day);
  state.spawnTimer += dt;
  if (
    state.spawnTimer >= SPAWN_INTERVAL_SEC &&
    state.queue.length < cfg.queueMax &&
    state.arrivalsSpawned < state.arrivalsPlanned
  ) {
    state.spawnTimer = 0;
    spawnNext(state.queue, state.day, state.rng, state.arrivalsSpawned, state.criticSlots);
    state.arrivalsSpawned += 1;
  }
  if (state.servedToday >= cfg.quota) {
    return finishDay(state);
  }
  state.particles.update(dt);
  return state;
}

export function handleKey(state, key) {
  const lower = key.length === 1 ? key.toLowerCase() : key;
  if (lower === 'm') return toggleMute(state);
  if (state.screen === 'title') {
    if (key === 'Enter' || key === ' ') return startNewRun(state);
  } else if (state.screen === 'dayIntro') {
    if (key === 'Enter' || key === ' ') return beginDay(state);
  } else if (state.screen === 'play') {
    if (lower === 'p') return togglePause(state);
    // Space (brew) dan X (dump) diimplementasi di fase 2.
  } else if (state.screen === 'dayResult') {
    if (key === 'Enter') return continueFromResults(state);
    if (key === '1' || key === '2' || key === '3') buyOffer(state, Number(key) - 1);
  } else if (state.screen === 'win' || state.screen === 'gameover') {
    if (key === 'Enter') return startNewRun(state);
  }
  return state;
}

export function handleClick(state, x, y) {
  if (state.paused && state.screen === 'play') {
    if (pointInRect(x, y, LAYOUT.resumeButton)) return togglePause(state);
    return state;
  }
  if (state.screen === 'title') {
    if (pointInRect(x, y, LAYOUT.startButton)) return startNewRun(state);
  } else if (state.screen === 'dayIntro') {
    if (pointInRect(x, y, LAYOUT.beginButton)) return beginDay(state);
  } else if (state.screen === 'dayResult') {
    for (let i = 0; i < state.shopOffers.length; i += 1) {
      if (pointInRect(x, y, shopCardRect(i))) {
        buyOffer(state, i);
        return state;
      }
    }
    if (pointInRect(x, y, LAYOUT.continueButton)) return continueFromResults(state);
  } else if (state.screen === 'win' || state.screen === 'gameover') {
    if (pointInRect(x, y, LAYOUT.playAgainButton)) return startNewRun(state);
  }
  // Klik saat play (kartu/slot/pelanggan) diimplementasi di fase 2.
  return state;
}

function seedFromUrl() {
  try {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get('seed');
    if (raw !== null && raw !== '') {
      const n = Number(raw);
      if (Number.isFinite(n)) return n >>> 0;
    }
  } catch {
    // Abaikan: seed default di bawah.
  }
  return (Date.now() % 2147483647) >>> 0;
}

export function boot(canvas) {
  const ctx = canvas.getContext('2d');
  const state = createState(seedFromUrl());
  bindInput(canvas, {
    onClick: (x, y) => handleClick(state, x, y),
    onKey: (key) => handleKey(state, key),
  });
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    update(state, dt);
    drawScreen(ctx, state);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  return state;
}

// Boot otomatis di browser. Di Node (tes headless) document tidak ada,
// modul ini hanya mengekspor fungsi state machine.
if (typeof document !== 'undefined') {
  const canvas = document.getElementById('game');
  if (canvas) boot(canvas);
}

export { GAME_HEIGHT, GAME_WIDTH, MAX_HEARTS };
