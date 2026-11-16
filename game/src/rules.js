// rules.js — seluruh konstanta balance, pembangkit resep, dan tabel reaksi.
// Satu-satunya sumber angka game. Tidak ada DOM di sini: fungsi-fungsi ini
// murni dan bisa diuji headless. Semua angka mengikuti brief Alembic Rush
// dan putusan HQ atas ambiguitas (lihat komentar HQ-1..HQ-6 di main.js).

export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;

export const TOTAL_DAYS = 10;
export const MAX_HEARTS = 5;
export const START_HEARTS = 5;
export const HAND_SIZE = 5;
export const BASE_CAULDRON_SLOTS = 4;
export const MAX_QUEUE = 4;
export const PERFECT_DAY_SCORE = 50;
export const PERFECT_DAY_COINS = 10;
export const SPAWN_INTERVAL_SEC = 6;
export const INITIAL_SPAWNS = 2;
export const CRITIC_FIRST_SLOT_INDEX = 1;
export const RECIPE_MAX_REPEATS = 3;
export const NOTICE_DURATION_SEC = 2.5;
export const REJECT_FLASH_SEC = 0.6;
export const ARRIVAL_BUFFER = 5;
export const FREEZE_SEC = 4;
export const PURIST_START_DAY = 7;
export const PURIST_CHANCE = 0.3;
export const CRITIC_START_DAY = 5;
export const CRITIC_DOUBLE_DAY = 8;
export const EXTRA_SLOT_MIN_DAY = 6;
export const WARNING_FRACTION = 0.25;
export const BELL_EARLY_SEC = 5;

// Enam reagen. Setiap reagen yang ditaruh di slot katalis memicu reaksi
// bernama miliknya saat sajian berhasil.
export const ELEMENTS = [
  { id: 'cinnabar', name: 'Cinnabar', catalyst: 'Seared', color: '#e5484d', glow: '#ff8a5c', glyph: 'flame' },
  { id: 'moonwell', name: 'Moonwell', catalyst: 'Chilled', color: '#3e9bff', glow: '#8ec9ff', glyph: 'drop' },
  { id: 'thornroot', name: 'Thornroot', catalyst: 'Fresh', color: '#3fb970', glow: '#7fe0a3', glyph: 'leaf' },
  { id: 'hivegold', name: 'Hivegold', catalyst: 'Glazed', color: '#f2b234', glow: '#ffd97a', glyph: 'hex' },
  { id: 'gloomcap', name: 'Gloomcap', catalyst: 'Strange', color: '#9b6bff', glow: '#c4a6ff', glyph: 'shroom' },
  { id: 'saltstar', name: 'Saltstar', catalyst: 'Set', color: '#c8d4e0', glow: '#ffffff', glyph: 'star' },
];

export const ELEMENT_BY_ID = Object.fromEntries(ELEMENTS.map((e) => [e.id, e]));

export const REACTIONS = {
  cinnabar: { name: 'Seared', text: '+50% coins for this serve' },
  moonwell: { name: 'Chilled', text: '+20% patience for the whole queue' },
  thornroot: { name: 'Fresh', text: 'Draw 1 card' },
  hivegold: { name: 'Glazed', text: '+1 heart, up to 5' },
  gloomcap: { name: 'Strange', text: 'Score x1.5, but Purists refuse it' },
  saltstar: { name: 'Set', text: 'Patience frozen for 4 seconds' },
};

// Kartu utilitas: tidak masuk resep, efeknya langsung saat dimainkan.
export const UTILITIES = {
  stir: { id: 'stir', name: 'Stir', price: 20, text: 'Draw 2 cards' },
  cool: { id: 'cool', name: 'Cool', price: 18, text: '+10% patience for the queue' },
  purge: { id: 'purge', name: 'Purge', price: 10, text: 'Dump the cauldron, no penalty' },
};

export function isUtility(cardId) {
  return cardId === 'stir' || cardId === 'cool' || cardId === 'purge';
}

export function isElement(cardId) {
  return Object.prototype.hasOwnProperty.call(ELEMENT_BY_ID, cardId);
}

export const REAGENT_PRICES = {
  cinnabar: 12,
  moonwell: 12,
  thornroot: 12,
  hivegold: 16,
  gloomcap: 16,
  saltstar: 20,
};

export const RELICS = {
  ladle: { id: 'ladle', name: 'Copper Ladle', price: 25, text: '+1 coin per serve' },
  bell: { id: 'bell', name: 'Bell', price: 20, text: 'Patience warning 5s earlier' },
  extraSlot: { id: 'extraSlot', name: 'Extra Slot', price: 40, text: '+1 cauldron slot', minDay: EXTRA_SLOT_MIN_DAY },
};

// Tabel hari. Indeks 0 tidak dipakai agar DAY_TABLE[hari] langsung cocok.
export const DAY_TABLE = [
  null,
  { day: 1, queueMax: 2, recipeMin: 2, recipeMax: 2, patience: 50, quota: 4, critics: 0 },
  { day: 2, queueMax: 2, recipeMin: 2, recipeMax: 2, patience: 45, quota: 5, critics: 0 },
  { day: 3, queueMax: 3, recipeMin: 2, recipeMax: 3, patience: 42, quota: 6, critics: 0 },
  { day: 4, queueMax: 3, recipeMin: 2, recipeMax: 3, patience: 39, quota: 7, critics: 0 },
  { day: 5, queueMax: 4, recipeMin: 3, recipeMax: 3, patience: 36, quota: 8, critics: 1 },
  { day: 6, queueMax: 4, recipeMin: 3, recipeMax: 3, patience: 33, quota: 9, critics: 1 },
  { day: 7, queueMax: 4, recipeMin: 3, recipeMax: 3, patience: 30, quota: 10, critics: 1 },
  { day: 8, queueMax: 4, recipeMin: 3, recipeMax: 3, patience: 28, quota: 11, critics: 2 },
  { day: 9, queueMax: 4, recipeMin: 3, recipeMax: 4, patience: 26, quota: 12, critics: 2 },
  { day: 10, queueMax: 4, recipeMin: 3, recipeMax: 4, patience: 24, quota: 13, critics: 2 },
];

export function dayConfig(day) {
  return DAY_TABLE[day];
}

export const UNLOCK_DAY = {
  cinnabar: 1,
  moonwell: 1,
  thornroot: 1,
  hivegold: 3,
  gloomcap: 5,
  saltstar: 7,
};

// AMENDMEN BRIEF — DICABUT (putusan Xora, Stage 3): UNLOCK_COPIES sempat
// 5 pada tuning Tahap 1, tetapi simulasi membuktikan 5 kopi memperburuk
// pengenceran elemen dasar (deck lebih besar, P(tangan tanpa cinnabar)
// naik 30%→42% di hari 7+, P(tangan mati) tidak membaik). Kembali ke 3,
// sesuai brief awal. Deck dasar: 12/15/18/21 kartu di hari 1/3/5/7.
export const UNLOCK_COPIES = 3;

// Mulligan (Stage 3): biaya dasar 2 koin; tagihan = min(biaya, koin) —
// koin tidak pernah minus, mulligan selalu bisa dipakai. Eskalasi 3b
// DITOLAK BERDASARKAN DATA (MULLIGAN_ESCALATION=false): pada simulasi
// 300 run/persona, eskalasi 2/4/8/16 menjatuhkan win rate skilled ke
// 38,7% (di bawah pita 40–85%), fraksi tunggu buntu naik ke 32,4%/
// 47,0% (skilled/optimal), dan median mulligan optimal tetap 443
// (jauh di atas pita 30) — lantai min(biaya, koin) membuat redraw tetap
// gratis saat koin habis. Biaya DATAR 2 dipertahankan sebagai konfigurasi
// final. mulliganCostFor tetap ada agar eksperimen eskalasi terdokumentasi.
export const MULLIGAN_BASE_COST = 2;
export const MULLIGAN_MAX_COST = 16;
export const MULLIGAN_ESCALATION = false;
export function mulliganCostFor(streak) {
  if (!MULLIGAN_ESCALATION) return MULLIGAN_BASE_COST;
  return Math.min(MULLIGAN_BASE_COST * 2 ** streak, MULLIGAN_MAX_COST);
}

export function unlockedElements(day) {
  return ELEMENTS.filter((e) => UNLOCK_DAY[e.id] <= day).map((e) => e.id);
}

export function newlyUnlocked(day) {
  return ELEMENTS.filter((e) => UNLOCK_DAY[e.id] === day).map((e) => e.id);
}

// RNG deterministik (mulberry32) agar satu seed selalu memberi run yang sama.
export function makeRng(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pickInt(rng, min, max) {
  return min + Math.floor(rng() * (max - min + 1));
}

export function recipeSizeFor(day, rng) {
  const cfg = dayConfig(day);
  return pickInt(rng, cfg.recipeMin, cfg.recipeMax);
}

// Resep = multiset elemen dari pool yang sudah terbuka. Satu elemen dibatasi
// maksimal 3 salinan agar resep selalu bisa dibuat dari deck (elemen baru
// masuk deck 3 salinan).
export function generateRecipe(day, rng) {
  const pool = unlockedElements(day);
  const size = recipeSizeFor(day, rng);
  const counts = {};
  const recipe = [];
  let guard = 0;
  while (recipe.length < size && guard < 200) {
    guard += 1;
    const el = pool[Math.floor(rng() * pool.length)];
    if ((counts[el] || 0) >= RECIPE_MAX_REPEATS) continue;
    counts[el] = (counts[el] || 0) + 1;
    recipe.push(el);
  }
  return recipe;
}

export function sameMultiset(a, b) {
  if (a.length !== b.length) return false;
  const counts = {};
  for (const x of a) counts[x] = (counts[x] || 0) + 1;
  for (const x of b) {
    if (!counts[x]) return false;
    counts[x] -= 1;
  }
  return true;
}

// HQ-5: kritik menempati slot kedatangan TETAP, bukan peluang. Slot dipilih
// dari indeks kedatangan 1..quota-1 (0-based), jadi kritik dijamin muncul
// sebelum kuota hari itu bisa tercapai. Deterministik per seed.
export function planCriticSlots(day, rng) {
  const cfg = dayConfig(day);
  const n = cfg.critics;
  if (n === 0) return [];
  const pool = [];
  for (let i = CRITIC_FIRST_SLOT_INDEX; i < cfg.quota; i += 1) pool.push(i);
  const slots = [];
  while (slots.length < n && pool.length > 0) {
    const at = Math.floor(rng() * pool.length);
    slots.push(pool.splice(at, 1)[0]);
  }
  return slots.sort((a, b) => a - b);
}

export function criticPatience(basePatience) {
  return basePatience / 2;
}

// Purist: mulai hari 7, 30% dari kedatangan non-kritik. Angka 30% adalah
// interpretasi fase 1 (brief tidak menyebut frekuensi) — HQ bisa koreksi.
export function rollPurist(day, isCritic, rng) {
  if (day < PURIST_START_DAY || isCritic) return false;
  return rng() < PURIST_CHANCE;
}

// HQ-6: Purist + katalis Gloomcap (Strange) = sajian DITOLAK. Predikat ini
// dipakai cauldron.js; penolakan tidak mengubah state apa pun selain umpan
// balik visual (brew tetap, combo tetap, tangan tidak di-refill).
export function isRejectedServe(customer, catalystId) {
  return Boolean(customer && customer.purist && catalystId === 'gloomcap');
}

// HQ-2: combo naik SEBELUM pengali dihitung. comboAfter = combo sesudah naik.
// Sajian berhasil pertama dalam beruntun memakai x1.25.
export function comboMultiplier(comboAfter) {
  return Math.min(3.0, 1 + 0.25 * comboAfter);
}

// Bonus katalis diterapkan SETELAH pengali combo. Hanya Strange mengubah skor.
export function serveScore(elementCount, comboAfter, catalystId) {
  let score = 10 * elementCount * comboMultiplier(comboAfter);
  if (catalystId === 'gloomcap') score *= 1.5;
  return Math.round(score);
}

// Koin: 4 per elemen + relic ladle, lalu pengali Seared (katalis Cinnabar),
// kritik x2 (HQ-5: koin saja), Purist +25% (koin saja).
export function serveCoins(elementCount, opts = {}) {
  let coins = 4 * elementCount + (opts.ladle ? 1 : 0);
  if (opts.seared) coins *= 1.5;
  if (opts.critic) coins *= 2;
  if (opts.purist) coins *= 1.25;
  return Math.round(coins);
}

export function rankFor(score) {
  if (score >= 1200) return 'S';
  if (score >= 900) return 'A';
  if (score >= 600) return 'B';
  return 'C';
}

// Sisa kesabaran saat peringatan berbunyi. Bell: 5 detik lebih awal.
export function warningRemaining(maxPatience, hasBell) {
  const base = WARNING_FRACTION * maxPatience;
  return hasBell ? Math.min(maxPatience, base + BELL_EARLY_SEC) : base;
}

// Deck awal: 4 salinan tiap elemen awal. Elemen baru masuk 3 salinan saat
// terbuka. extraCards = salinan hasil beli di shop (reagen + utilitas).
export function startingDeck() {
  const deck = [];
  for (const id of ['cinnabar', 'moonwell', 'thornroot']) {
    for (let i = 0; i < 4; i += 1) deck.push(id);
  }
  return deck;
}

export function deckComposition(day, extraCards) {
  const deck = startingDeck();
  for (const id of ['hivegold', 'gloomcap', 'saltstar']) {
    if (UNLOCK_DAY[id] <= day) {
      for (let i = 0; i < UNLOCK_COPIES; i += 1) deck.push(id);
    }
  }
  if (extraCards) deck.push(...extraCards);
  return deck;
}

export function plannedArrivals(day) {
  return dayConfig(day).quota + ARRIVAL_BUFFER;
}

export function cauldronSlotCount(ownedRelics) {
  return BASE_CAULDRON_SLOTS + (ownedRelics.includes('extraSlot') ? 1 : 0);
}

// Shop antar hari: 3 tawaran. upcomingDay = hari yang akan dimasuki.
// Extra Slot eligible saat upcomingDay >= 6 (pertama muncul di shop sesudah
// hari 5). Relic yang sudah dimiliki tidak ditawarkan lagi.
export function shopPool(upcomingDay, ownedRelics) {
  const pool = [];
  for (const id of unlockedElements(upcomingDay)) {
    pool.push({ kind: 'reagent', id, price: REAGENT_PRICES[id] });
  }
  for (const u of Object.values(UTILITIES)) {
    pool.push({ kind: 'utility', id: u.id, price: u.price });
  }
  for (const r of Object.values(RELICS)) {
    if (ownedRelics.includes(r.id)) continue;
    if (r.minDay && upcomingDay < r.minDay) continue;
    pool.push({ kind: 'relic', id: r.id, price: r.price });
  }
  return pool;
}

export function generateShopOffers(upcomingDay, ownedRelics, rng) {
  const bag = shopPool(upcomingDay, ownedRelics);
  const offers = [];
  while (offers.length < 3 && bag.length > 0) {
    const at = Math.floor(rng() * bag.length);
    offers.push(bag.splice(at, 1)[0]);
  }
  return offers;
}

export function offerTitle(offer) {
  if (offer.kind === 'reagent') return ELEMENT_BY_ID[offer.id].name;
  if (offer.kind === 'utility') return UTILITIES[offer.id].name;
  return RELICS[offer.id].name;
}

export function offerText(offer) {
  if (offer.kind === 'reagent') {
    const el = ELEMENT_BY_ID[offer.id];
    return `Reagent card. Catalyst: ${el.catalyst}.`;
  }
  if (offer.kind === 'utility') return UTILITIES[offer.id].text;
  return RELICS[offer.id].text;
}

// Baris kontrol play, verbatim brief. Jangan diubah tanpa putusan HQ.
export const PLAY_CONTROLS_LINE =
  'Click card = play, Click slot = return, Click customer = target, Space = brew, X = dump, R = mulligan, M = mute, P = pause';

// Koreografi klik sebenarnya (HQ-1), dijelaskan lengkap di title screen.
// Baris ringkasan kunci di title memakai token yang sama persis dengan
// PLAY_CONTROLS_LINE (amendmen mulligan), ditambah 1 baris semantik R.
export const TITLE_CONTROLS = [
  'Click a card to select it, then click a cauldron slot to place it.',
  'Click the selected card again to auto-place it in the first empty slot.',
  'Click the catalyst slot to place the selected card as catalyst.',
  'Click a filled slot to return its card to your hand.',
  'Click a customer to target them for the next serve.',
  'R = mulligan: discard your whole hand, draw 5 new cards (2 coins, combo resets).',
  'Space = brew, X = dump, R = mulligan, M = mute, P = pause.',
];
