// states.js — state machine Alembic Rush.
// Alur state: title -> dayIntro -> play -> dayResult (shop) -> dayIntro
// berikutnya ... -> win (kuota hari 10 tuntas) atau gameover (hati habis).
// Semua jalur restart memulai run baru hari 1. Pause adalah overlay di atas
// play dan membekukan update. File ini tidak menggambar sendiri: render
// didelegasikan ke ui.js, input ke input.js, audio ke audio.js. Penyiapan
// hari dan langkah simulasi per frame hidup di director.js.
//
// Putusan HQ yang dikunci di state machine ini:
// HQ-1: koreografi klik (pilih -> taruh / klik 2x auto-place) dijelaskan
//   lengkap di title screen (TITLE_CONTROLS di rules.js) dan diimplementasi
//   di handlePlayClick; baris kontrol play verbatim brief.
// HQ-2: combo naik SEBELUM pengali (lihat serveScore di rules.js).
// HQ-3: walk-out mereset combo (penanganan di update()).
// HQ-4: X dump mereset combo, Purge tidak (resolusi di fase 2).
// HQ-5: kritik = koin x2 saja, slot kedatangan tetap (planCriticSlots).
// HQ-6: Purist + Strange ditolak tanpa mengubah state (isRejectedServe).
//
// (Pecahan dari main.js, Fase 1 v3: pindah verbatim.)

import {
  COOL_CHARM_FRACTION,
  COOL_FRACTION,
  ELEMENT_BY_ID,
  GOLD_STAR_SCORE,
  HAGGLE_DISCOUNT,
  HAND_SIZE,
  NOTICE_DURATION_SEC,
  PERFECT_DAY_COINS,
  PERFECT_DAY_SCORE,
  SHOP_MIN_PRICE,
  START_HEARTS,
  STIR_CHARM_DRAW,
  STIR_DRAW,
  TOTAL_DAYS,
  UNLOCK_COPIES,
  generateShopOffers,
  isElement,
  isUtility,
  makeRng,
  mulliganCostFor,
  newlyUnlocked,
  rankFor,
} from './rules.js';
import { drawCards } from './deck.js';
import {
  clearCauldron,
  createCauldron,
  discardBrew,
  firstEmptySlot,
  placeCatalyst,
  placeInSlot,
  resolveBrew,
  takeCatalyst,
  takeFromSlot,
} from './cauldron.js';
import { resetCustomerIds } from './customers.js';
import { AudioEngine } from './audio.js';
import { ParticleSystem } from './particles.js';
import {
  CATALYST_RECT,
  LAYOUT,
  cauldronSlotRect,
  customerRect,
  handCardRect,
  shopCardRect,
} from './ui.js';
import { pointInRect } from './render_scene.js';
import { beginDay } from './director.js';
import {
  ledgerCount,
  loadLedger,
  recordRelic,
  recordRunEnd,
  resetLedger,
  saveLedger,
} from './ledger.js';
import { dailyMarketFor } from './market.js';

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
    notes.push(`${ELEMENT_BY_ID[id].name} unlocked and added to the deck (${UNLOCK_COPIES} copies).`);
  }
  if (day === 5) notes.push('Critics arrive: half patience, double coins.');
  if (day === 6) notes.push('Extra Slot relic is now sold in the shop.');
  if (day === 7) notes.push('Purists arrive: +25% coins, but they refuse Strange brews.');
  return notes;
}

export function createState(seed = 1) {
  const ledger = loadLedger();
  const state = {
    screen: 'title',
    paused: false,
    seed: seed >>> 0,
    rng: makeRng(seed),
    // RNG visual terpisah (gelembung, ambient, burst): tidak pernah
    // menggeser aliran RNG permainan, dan deterministik per seed.
    visualRng: makeRng((seed ^ 0x5f356495) >>> 0),
    mouse: null,
    bestScore: loadBestScore(),
    // Meta antar-run (Fase 2): Ledger persisten, variasi harian
    // TODAY'S MARKET, nomor run (regular sejak run ke-2), dan pelacakan
    // run untuk footer LEDGER UPDATED di layar win.
    ledger,
    dailyMarket: dailyMarketFor(),
    runNumber: (ledger.runsCompleted || 0) + 1,
    runNewRelics: [],
    runRegularVisits: 0,
    runNewRegulars: [],
    newLedgerArmed: false,
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
    noticeLeft: 0,
    rejectFlash: 0,
    animTime: 0,
    bubbleTimer: 0,
    ambientTimer: 0,
    eventBanner: null,
    eventBannerLeft: 0,
    // Pelacakan mulligan/ekonomi run (untuk metrik + eskalasi biaya 3b).
    mulliganCount: 0,
    mulliganSpend: 0,
    mulliganStreak: 0,
    coinsEarned: 0,
  };
  return state;
}

// Mulai run baru hari 1. Seed maju tiap restart agar run berikutnya berbeda.
export function startNewRun(state, seed = null) {
  const nextSeed = seed === null ? (state.seed + 7919) >>> 0 : seed >>> 0;
  state.seed = nextSeed;
  state.rng = makeRng(nextSeed);
  state.visualRng = makeRng((nextSeed ^ 0x5f356495) >>> 0);
  state.mouse = null;
  state.eventBanner = null;
  state.eventBannerLeft = 0;
  state.ambientTimer = 0;
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
  state.noticeLeft = 0;
  state.rejectFlash = 0;
  state.mulliganCount = 0;
  state.mulliganSpend = 0;
  state.mulliganStreak = 0;
  state.coinsEarned = 0;
  state.runNumber = ((state.ledger && state.ledger.runsCompleted) || 0) + 1;
  state.runNewRelics = [];
  state.runRegularVisits = 0;
  state.runNewRegulars = [];
  state.newLedgerArmed = false;
  state.introNotes = introNotesFor(1);
  resetCustomerIds();
  state.particles.clear();
  return state;
}

function updateBest(state) {
  if (state.score > state.bestScore) {
    state.bestScore = state.score;
    saveBestScore(state.bestScore);
  }
}

// Akhir sebuah run (menang/kalah): hitungan run +1, best run diperbarui,
// Ledger disimpan. Dipanggil tepat sekali per run.
function endRun(state) {
  if (!state.ledger) return;
  recordRunEnd(state.ledger, {
    score: state.score,
    rank: rankFor(state.score),
    day: state.day,
  });
  saveLedger(state.ledger);
}

// Kuota hari tercapai: bonus hari sempurna, lalu shop atau win.
export function finishDay(state) {
  const perfect = state.lostToday === 0;
  const perfectScore = PERFECT_DAY_SCORE + (state.ownedRelics.includes('goldStar') ? GOLD_STAR_SCORE : 0);
  if (perfect) {
    state.score += perfectScore;
    state.coins += PERFECT_DAY_COINS;
    state.coinsEarned = (state.coinsEarned || 0) + PERFECT_DAY_COINS;
  }
  state.dayStats = { served: state.servedToday, lost: state.lostToday, perfect, perfectScore };
  if (state.day >= TOTAL_DAYS) {
    state.screen = 'win';
    updateBest(state);
    endRun(state);
    return state;
  }
  state.shopOffers = generateShopOffers(
    state.day + 1,
    state.ownedRelics,
    state.rng,
    ledgerCount(state.ledger),
  );
  if (state.ownedRelics.includes('haggleCoin')) {
    for (const offer of state.shopOffers) {
      offer.price = Math.max(SHOP_MIN_PRICE, offer.price - HAGGLE_DISCOUNT);
    }
  }
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
  endRun(state);
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
    // Relic yang dibeli tercatat permanen di Ledger (membuka tier shop
    // run berikutnya); relic baru run ini dilacak untuk footer win.
    if (state.ledger) {
      if (recordRelic(state.ledger, offer.id) && Array.isArray(state.runNewRelics)) {
        state.runNewRelics.push(offer.id);
      }
      saveLedger(state.ledger);
    }
  }
  return { ok: true };
}

// New Ledger (tombol di title / tombol N): klik pertama meng-arm
// (tombol berubah jadi SURE?), klik kedua mereset Ledger. Klik lain di
// title membatalkan arm.
export function armOrResetLedger(state) {
  if (!state.newLedgerArmed) {
    state.newLedgerArmed = true;
    return state;
  }
  state.ledger = resetLedger();
  state.runNumber = 1;
  state.newLedgerArmed = false;
  return state;
}

export function setNotice(state, text) {
  state.notice = text;
  state.noticeLeft = NOTICE_DURATION_SEC;
  return state;
}

// X dump (HQ-4): buang slot + katalis, combo RESET, tangan tidak di-refill.
export function dumpCauldron(state) {
  const removed = discardBrew(state.cauldron);
  if (removed.length === 0) return { status: 'empty' };
  state.discard.push(...removed);
  state.combo = 0;
  state.selected = null;
  setNotice(state, 'Dumped the cauldron. Combo reset.');
  return { status: 'dumped', removed };
}

// Mulligan tombol R (AMENDMEN BRIEF, tuning Tahap 2; biaya Stage 3): buang
// SELURUH tangan lalu tarik 5 kartu baru dari deck (reshuffle discard bila
// deck kurang), combo RESET, kauldron TIDAK tersentuh. Biaya = min(biaya
// saat ini, koin) — koin tidak pernah minus, mulligan selalu bisa dipakai.
// Boleh dipakai kapan saja saat play (tidak saat pause/layar lain).
export function mulligan(state) {
  if (state.screen !== 'play' || state.paused) return state;
  const cost = mulliganCostFor(state.mulliganStreak || 0);
  const charge = Math.min(cost, state.coins);
  state.coins -= charge;
  state.mulliganSpend = (state.mulliganSpend || 0) + charge;
  state.mulliganCount = (state.mulliganCount || 0) + 1;
  state.mulliganStreak = (state.mulliganStreak || 0) + 1;
  const discarded = state.hand.slice();
  state.discard.push(...discarded);
  state.hand = [];
  state.selected = null;
  drawCards(state.hand, state.deck, state.discard, HAND_SIZE, state.rng);
  state.combo = 0;
  setNotice(state, `Mulligan — fresh hand, combo reset (-${charge} coins).`);
  return state;
}

// Aktivasi kartu utilitas (klik kedua pada kartu terpilih): Stir tarik 2,
// Cool +10% kesabaran antrean, Purge buang isi kauldron TANPA biaya —
// combo TIDAK berubah dan katalis tetap (HQ-4).
export function activateUtilityCard(state, index) {
  const cardId = state.hand[index];
  if (!isUtility(cardId)) return { status: 'not-utility' };
  state.hand.splice(index, 1);
  state.discard.push(cardId);
  state.selected = null;
  if (cardId === 'stir') {
    const count = state.ownedRelics.includes('stirCharm') ? STIR_CHARM_DRAW : STIR_DRAW;
    const drawn = drawCards(state.hand, state.deck, state.discard, count, state.rng);
    setNotice(state, `Stir! Drew ${drawn.length} card${drawn.length === 1 ? '' : 's'}.`);
    return { status: 'stir', drawn };
  }
  if (cardId === 'cool') {
    const fraction = state.ownedRelics.includes('coolCharm') ? COOL_CHARM_FRACTION : COOL_FRACTION;
    for (const customer of state.queue) {
      customer.patience = Math.min(
        customer.maxPatience,
        customer.patience + fraction * customer.maxPatience,
      );
    }
    setNotice(state, 'Cool! The queue calms down.');
    return { status: 'cool' };
  }
  const removed = clearCauldron(state.cauldron);
  state.discard.push(...removed);
  setNotice(state, 'Purge! The cauldron is emptied, no penalty.');
  return { status: 'purge', removed };
}

export function handleKey(state, key) {
  const lower = key.length === 1 ? key.toLowerCase() : key;
  if (lower === 'm') return toggleMute(state);
  if (state.screen === 'title') {
    if (key === 'Enter' || key === ' ') return startNewRun(state);
    if (lower === 'l') {
      state.screen = 'ledger';
      state.newLedgerArmed = false;
      return state;
    }
    if (lower === 'n') return armOrResetLedger(state);
  } else if (state.screen === 'ledger') {
    if (key === 'Enter' || key === 'Escape' || lower === 'l') {
      state.screen = 'title';
      return state;
    }
  } else if (state.screen === 'dayIntro') {
    if (key === 'Enter' || key === ' ') return beginDay(state);
  } else if (state.screen === 'play') {
    if (lower === 'p') return togglePause(state);
    if (state.paused) return state;
    if (key === ' ') {
      resolveBrew(state);
      return state;
    }
    if (lower === 'x') {
      dumpCauldron(state);
      return state;
    }
    if (lower === 'r') {
      mulligan(state);
      return state;
    }
  } else if (state.screen === 'dayResult') {
    if (key === 'Enter') return continueFromResults(state);
    if (key === '1' || key === '2' || key === '3') buyOffer(state, Number(key) - 1);
  } else if (state.screen === 'win' || state.screen === 'gameover') {
    if (key === 'Enter') return startNewRun(state);
  }
  return state;
}

// Klik saat play (HQ-1): klik kartu = pilih, klik slot = taruh, klik kartu
// terpilih kedua kali = auto-place ke slot kosong pertama (atau aktivasi
// untuk kartu utilitas). Klik slot terisi = kembalikan ke tangan. Klik
// pelanggan = target. Klik area kosong = batalkan pilihan.
export function handlePlayClick(state, x, y) {
  for (let i = 0; i < state.queue.length; i += 1) {
    if (pointInRect(x, y, customerRect(i, state.queue.length))) {
      state.targetId = state.queue[i].id;
      return state;
    }
  }
  const slots = state.cauldron.slots;
  for (let i = 0; i < slots.length; i += 1) {
    if (pointInRect(x, y, cauldronSlotRect(slots.length, i))) {
      if (slots[i] !== null) {
        const card = takeFromSlot(state.cauldron, i);
        state.hand.push(card);
        state.selected = null;
      } else if (state.selected !== null) {
        const cardId = state.hand[state.selected];
        if (isElement(cardId) && placeInSlot(state.cauldron, i, cardId)) {
          state.hand.splice(state.selected, 1);
          state.selected = null;
          state.audio.bubble(cardId);
        }
      }
      return state;
    }
  }
  if (pointInRect(x, y, CATALYST_RECT)) {
    if (state.cauldron.catalyst !== null) {
      const card = takeCatalyst(state.cauldron);
      state.hand.push(card);
      state.selected = null;
    } else if (state.selected !== null) {
      const cardId = state.hand[state.selected];
      if (isElement(cardId) && placeCatalyst(state.cauldron, cardId)) {
        state.hand.splice(state.selected, 1);
        state.selected = null;
        state.audio.bubble(cardId);
      }
    }
    return state;
  }
  for (let i = 0; i < state.hand.length; i += 1) {
    if (pointInRect(x, y, handCardRect(state.hand.length, i))) {
      const cardId = state.hand[i];
      if (state.selected === i) {
        if (isUtility(cardId)) {
          activateUtilityCard(state, i);
        } else {
          const slot = firstEmptySlot(state.cauldron);
          if (slot !== -1 && placeInSlot(state.cauldron, slot, cardId)) {
            state.hand.splice(i, 1);
            state.audio.bubble(cardId);
          }
          state.selected = null;
        }
      } else {
        state.selected = i;
      }
      return state;
    }
  }
  state.selected = null;
  return state;
}

export function handleClick(state, x, y) {
  if (state.paused && state.screen === 'play') {
    if (pointInRect(x, y, LAYOUT.resumeButton)) return togglePause(state);
    return state;
  }
  if (state.screen === 'title') {
    const wasArmed = state.newLedgerArmed;
    state.newLedgerArmed = false;
    if (pointInRect(x, y, LAYOUT.startButton)) return startNewRun(state);
    if (pointInRect(x, y, LAYOUT.ledgerButton)) {
      state.screen = 'ledger';
      return state;
    }
    if (pointInRect(x, y, LAYOUT.newLedgerButton)) {
      state.newLedgerArmed = wasArmed;
      return armOrResetLedger(state);
    }
  } else if (state.screen === 'ledger') {
    if (pointInRect(x, y, LAYOUT.backButton)) {
      state.screen = 'title';
      return state;
    }
  } else if (state.screen === 'dayIntro') {
    if (pointInRect(x, y, LAYOUT.beginButton)) return beginDay(state);
  } else if (state.screen === 'play') {
    return handlePlayClick(state, x, y);
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
  return state;
}
