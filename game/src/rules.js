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

// ---- Konstanta efek relic (roster Xora, revisi Fase 2). Semua efek
// kecil dan variasi/pool saja; numerik dibatasi ±10% (plafon meta).
// Tidak ada yang mengubah angka inti v2 (resep, kuota, kesabaran dasar,
// biaya mulligan, atau ambang rank).
export const COOL_FRACTION = 0.1;
export const STIR_DRAW = 2;
// Peluang pesanan memakai famili signature saat keepsake-nya tercatat.
export const FAMILY_CHANCE = 0.25;
// Peluang spawn menjadi twin-order (Aludel) saat ada pelanggan mengantre.
export const TWIN_CHANCE = 0.15;
// Peluang hari memakai varian tema (saat relic variannya dimiliki).
export const THEME_VARIANT_CHANCE = 0.3;
// Parade Pip + hari hujan tenang: kesabaran x1.05.
export const PARADE_PATIENCE_FACTOR = 1.05;
export const RAIN_PATIENCE_FACTOR = 1.05;
// Mortar: harga shop -10% pada market day.
export const MARKET_DISCOUNT = 0.1;
// Glass: sajian terakhir hari itu +10% koin. Wax Seal: dendam yang
// lunas memberi +5% koin pada sajian berikutnya.
export const GLASS_COIN_FACTOR = 1.1;
export const SEAL_COIN_FACTOR = 1.05;
// Tool bundle (Second Athanor): 3 kartu utilitas untuk deck.
export const TOOL_BUNDLE_PRICE = 30;
export const TOOL_BUNDLE_CARDS = ['stir', 'cool', 'purge'];
// Tema yang dihitung "fog day" untuk Charter of the Fog Guild.
export const FOG_THEME_IDS = ['rainyDusk', 'quietRain'];

// Famili pesanan signature (keepsakes): keepsake yang TERCATAT di Ledger
// membuka famili itu ke pool resep run berikutnya (dibekukan saat run
// dimulai, seperti tier shop). template: 'doubleKey' = 2x elemen kunci +
// pengisi; 'pair' = kedua kunci + pengisi; 'quad' = 4 elemen berbeda
// termasuk kunci (hari 9-10 saja).
export const SIGNATURE_FAMILIES = {
  vex: { id: 'vex', keepsake: 'vexPestle', keys: ['gloomcap'], minDay: 5, template: 'doubleKey' },
  bram: { id: 'bram', keepsake: 'bramRetort', keys: ['cinnabar'], minDay: 1, template: 'doubleKey' },
  ilse: { id: 'ilse', keepsake: 'ilseStrainer', keys: ['moonwell'], minDay: 1, template: 'doubleKey' },
  marrow: { id: 'marrow', keepsake: 'marrowFan', keys: ['gloomcap', 'saltstar'], minDay: 7, template: 'pair' },
  quill: { id: 'quill', keepsake: 'quillAtlas', keys: ['saltstar'], minDay: 9, maxDay: 10, template: 'quad' },
};

// Famili yang aktif untuk sebuah run: keepsake-nya ada di Ledger.
export function familiesForLedger(ledger) {
  if (!ledger || !Array.isArray(ledger.relics)) return [];
  return Object.values(SIGNATURE_FAMILIES)
    .filter((f) => ledger.relics.includes(f.keepsake))
    .map((f) => f.id);
}

// Varian tema -> relic yang membukanya (dimiliki saat run berjalan).
// Kunci di sini WAJIB sama dengan kunci THEME_VARIANTS di render_scene.js.
export const VARIANT_RELICS = {
  quietRain: 'quietRain',
  snowfall: 'snowJar',
  longDusk: 'longDuskGlass',
  bloodMoonRite: 'bloodVial',
};

// Roster relic 24 slot (roster Xora, revisi Fase 2). tier 0 = 3 relic
// v2 yang tidak berubah; tier 1/2/3 terbuka bila Ledger mencatat >=
// RELIC_TIER_THRESHOLDS[tier] relic. `icon` memilih bentuk ikon
// prosedural di drawRelicIcon. Distribusi tier (7/7/7): tier 1 membuka
// keepsake pertama + varian tema awal + sejarah awal; tier 2 keepsake
// hari-1 sisanya + vessels + papers; tier 3 keepsake akhir-game
// (Quill hari 9-10, Marrow butuh dua elemen akhir) + event ekonomi +
// varian tantangan.
export const RELIC_TIER_THRESHOLDS = [0, 3, 9, 15];

export const RELICS = {
  ladle: { id: 'ladle', name: 'Copper Ladle', price: 25, text: '+1 coin per serve', tier: 0, icon: { shape: 'ladle' } },
  bell: { id: 'bell', name: 'Bell', price: 20, text: 'Patience warning 5s earlier', tier: 0, icon: { shape: 'bell' } },
  extraSlot: { id: 'extraSlot', name: 'Extra Slot', price: 40, text: '+1 cauldron slot', minDay: EXTRA_SLOT_MIN_DAY, tier: 0, icon: { shape: 'extraSlot' } },
  vexPestle: { id: 'vexPestle', name: "Vex's Silver Pestle", price: 24, text: "Vex's Gloomcap tincture orders join the pool.", tier: 1, icon: { shape: 'pestle', element: 'gloomcap' } },
  pipWhistle: { id: 'pipWhistle', name: "Pip's Tin Whistle", price: 22, text: 'Whistle music. One parade wave, +5% patience.', tier: 1, icon: { shape: 'whistle', element: 'hivegold' } },
  quietRain: { id: 'quietRain', name: 'Cucurbit of Quiet Rain', price: 22, text: 'Quiet-rain days: +5% patience that day.', tier: 1, icon: { shape: 'cucurbit' } },
  fireflyJar: { id: 'fireflyJar', name: 'Jar of Captured Fireflies', price: 18, text: 'Fireflies drift on night themes. Cosmetic.', tier: 1, icon: { shape: 'fireflies' } },
  snowJar: { id: 'snowJar', name: 'Bell-Jar of Snow', price: 18, text: 'Snowfall theme days. Cosmetic.', tier: 1, icon: { shape: 'snowJar' } },
  smallDebts: { id: 'smallDebts', name: 'Ledger of Small Debts', price: 20, text: 'Lifetime coins per regular shown in the roster.', tier: 1, icon: { shape: 'debts' } },
  firstReceipt: { id: 'firstReceipt', name: 'Receipt of the First Run', price: 18, text: 'Your first-run score, stamped in the Ledger.', tier: 1, icon: { shape: 'receipt' } },
  bramRetort: { id: 'bramRetort', name: "Bram's Cracked Retort", price: 24, text: "Bram's Cinnabar tonic orders join the pool.", tier: 2, icon: { shape: 'retort', element: 'cinnabar' } },
  ilseStrainer: { id: 'ilseStrainer', name: "Ilse's Linen Strainer", price: 24, text: "Ilse's Moonwell draught orders join the pool.", tier: 2, icon: { shape: 'strainer', element: 'moonwell' } },
  secondAthanor: { id: 'secondAthanor', name: 'The Second Athanor', price: 28, text: 'Shop adds a tool bundle offer (Stir+Cool+Purge).', tier: 2, icon: { shape: 'athanor' } },
  nineNecks: { id: 'nineNecks', name: 'Aludel of Nine Necks', price: 26, text: 'Nine-neck cauldron. Twin orders share a recipe.', tier: 2, icon: { shape: 'aludel' } },
  pelicanFlask: { id: 'pelicanFlask', name: 'Pelican Flask', price: 20, text: 'Liquid circulates to a side flask. Cosmetic.', tier: 2, icon: { shape: 'pelicanFlask' } },
  waxSeal: { id: 'waxSeal', name: 'The Wax Seal of Returns', price: 24, text: 'Grudges shown. Restored grudge: +5% next serve.', tier: 2, icon: { shape: 'waxSeal' } },
  borrowedAlmanac: { id: 'borrowedAlmanac', name: 'Almanac of Borrowed Days', price: 20, text: "Tomorrow's market theme previewed on the title.", tier: 2, icon: { shape: 'almanac' } },
  quillAtlas: { id: 'quillAtlas', name: "Quill's Ink-Stained Atlas", price: 28, text: '4-element Saltstar orders, days 9-10 only.', tier: 3, icon: { shape: 'atlas', element: 'saltstar' } },
  marrowFan: { id: 'marrowFan', name: "Marrow's Black Lace Fan", price: 28, text: 'Gloomcap-Saltstar pair orders join the pool.', tier: 3, icon: { shape: 'fan', element: 'gloomcap' } },
  nightMortar: { id: 'nightMortar', name: 'Mortar of the Night Market', price: 26, text: 'Next shop: prices -10%. A stamp in the Ledger.', tier: 3, icon: { shape: 'mortar' } },
  longDuskGlass: { id: 'longDuskGlass', name: 'Glass of the Long Dusk', price: 26, text: 'Long-dusk days. Last serve of the day +10%.', tier: 3, icon: { shape: 'longGlass' } },
  fogCharter: { id: 'fogCharter', name: 'Charter of the Fog Guild', price: 26, text: 'Fog days: one optional bonus order. No penalty.', tier: 3, icon: { shape: 'charter' } },
  crookedLadle: { id: 'crookedLadle', name: 'The Crooked Ladle', price: 20, text: 'Wobbling stir, variant stir sound. Cosmetic.', tier: 3, icon: { shape: 'crookedLadle' } },
  bloodVial: { id: 'bloodVial', name: 'Vial of the Blood Moon', price: 26, text: 'Blood-moon rite days: the Critic visits twice.', tier: 3, icon: { shape: 'bloodVial' } },
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
// masuk deck 3 salinan). Bila famili signature aktif (keepsake tercatat),
// peluang FAMILY_CHANCE resep memakai templat famili; tanpa famili aktif,
// tidak ada undian tambahan — aliran RNG persis v2.
export function generateRecipe(day, rng, families = []) {
  return generateRecipeWithFamily(day, rng, families).recipe;
}

export function familyAvailable(familyId, day) {
  const fam = SIGNATURE_FAMILIES[familyId];
  if (!fam) return false;
  if (day < fam.minDay) return false;
  if (fam.maxDay !== undefined && day > fam.maxDay) return false;
  return true;
}

function fillRecipe(recipe, counts, pool, size, rng, distinctOnly) {
  let guard = 0;
  while (recipe.length < size && guard < 200) {
    guard += 1;
    const el = pool[Math.floor(rng() * pool.length)];
    if ((counts[el] || 0) >= RECIPE_MAX_REPEATS) continue;
    if (distinctOnly && counts[el]) continue;
    counts[el] = (counts[el] || 0) + 1;
    recipe.push(el);
  }
  return recipe;
}

function generateFamilyRecipe(day, rng, fam) {
  const pool = unlockedElements(day);
  const cfg = dayConfig(day);
  const counts = {};
  const recipe = [];
  if (fam.template === 'quad') {
    recipe.push(fam.keys[0]);
    counts[fam.keys[0]] = 1;
    return fillRecipe(recipe, counts, pool, 4, rng, true);
  }
  const size = pickInt(rng, cfg.recipeMin, cfg.recipeMax);
  if (fam.template === 'doubleKey') {
    recipe.push(fam.keys[0], fam.keys[0]);
    counts[fam.keys[0]] = 2;
  } else {
    for (const key of fam.keys) {
      recipe.push(key);
      counts[key] = 1;
    }
  }
  return fillRecipe(recipe, counts, pool, size, rng, false);
}

export function generateRecipeWithFamily(day, rng, families = []) {
  const active = (families || []).filter((id) => familyAvailable(id, day));
  if (active.length > 0 && rng() < FAMILY_CHANCE) {
    const fam = SIGNATURE_FAMILIES[active[Math.floor(rng() * active.length)]];
    return { recipe: generateFamilyRecipe(day, rng, fam), family: fam.id };
  }
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
  return { recipe, family: null };
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

// Vial of the Blood Moon: pada hari rite, Critic berkunjung TEPAT 2 kali
// (brief + teks relic: "the Critic visits twice") — bukan +1 slot, karena
// hari 8-10 yang sudah punya 2 slot dasar akan menjadi 3.
export const RITE_CRITIC_VISITS = 2;

// HQ-5: kritik menempati slot kedatangan TETAP, bukan peluang. Slot dipilih
// dari indeks kedatangan 1..quota-1 (0-based), jadi kritik dijamin muncul
// sebelum kuota hari itu bisa tercapai. Deterministik per seed.
// extraCritics: slot kritik tambahan di atas jadwal dasar (dipakai beginDay
// untuk menegakkan tepat RITE_CRITIC_VISITS kunjungan pada hari rite).
export function planCriticSlots(day, rng, extraCritics = 0) {
  const cfg = dayConfig(day);
  const n = cfg.critics + extraCritics;
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
// kritik x2 (HQ-5: koin saja), Purist +25% (koin saja), bonus favorit
// regular +10% (plafon meta, Fase 2), sajian terakhir hari +10% (Glass
// of the Long Dusk), dan bonus dendam lunas +5% (Wax Seal). Satu
// pembulatan di akhir. Panggilan lama tanpa opsi baru menghasilkan angka
// yang sama persis.
export function serveCoins(elementCount, opts = {}) {
  let coins = 4 * elementCount + (opts.ladle ? 1 : 0);
  if (opts.seared) coins *= 1.5;
  if (opts.critic) coins *= 2;
  if (opts.purist) coins *= 1.25;
  if (opts.favorite) coins *= 1.1;
  if (opts.lastCustomer) coins *= GLASS_COIN_FACTOR;
  if (opts.sealBonus) coins *= SEAL_COIN_FACTOR;
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
// hari 5). Relic yang sudah dimiliki tidak ditawarkan lagi. Fase 2: tier
// relic terbuka mengikuti jumlah relic di Ledger PADA SAAT RUN DIMULAI
// (dibekukan di ledgerCountAtRunStart — temuan di run ini membuka pool
// run berikutnya, bukan shop di tengah run yang sama); ledgerCount 0 =
// pool v2 persis (3 relic tier 0).
export function shopPool(upcomingDay, ownedRelics, ledgerCount = 0) {
  const pool = [];
  for (const id of unlockedElements(upcomingDay)) {
    pool.push({ kind: 'reagent', id, price: REAGENT_PRICES[id] });
  }
  for (const u of Object.values(UTILITIES)) {
    pool.push({ kind: 'utility', id: u.id, price: u.price });
  }
  // Tool bundle (Second Athanor): tawaran paket 3 utilitas, hanya saat
  // Athanor dimiliki run ini. Bukan relic: tidak kena cap tawaran relic.
  if (ownedRelics.includes('secondAthanor')) {
    pool.push({ kind: 'bundle', id: 'toolBundle', price: TOOL_BUNDLE_PRICE });
  }
  for (const r of Object.values(RELICS)) {
    if (ownedRelics.includes(r.id)) continue;
    if (r.minDay && upcomingDay < r.minDay) continue;
    if (ledgerCount < (RELIC_TIER_THRESHOLDS[r.tier] || 0)) continue;
    pool.push({ kind: 'relic', id: r.id, price: r.price });
  }
  return pool;
}

export function generateShopOffers(upcomingDay, ownedRelics, rng, ledgerCount = 0) {
  const bag = shopPool(upcomingDay, ownedRelics, ledgerCount);
  const offers = [];
  // Fase 3: begitu tier 1 terbuka (Ledger >= 3), shop menawari paling
  // banyak 1 relic per kunjungan — menahan laju penumpukan relic di
  // run lanjutan tanpa mengubah undian run 1 (ledgerCount 0 = persis v2).
  const relicCap = ledgerCount >= 3 ? 1 : Infinity;
  let relicCount = 0;
  while (offers.length < 3 && bag.length > 0) {
    const at = Math.floor(rng() * bag.length);
    const offer = bag[at];
    if (offer.kind === 'relic' && relicCount >= relicCap) {
      const nonRelicAt = bag.findIndex((o) => o.kind !== 'relic');
      if (nonRelicAt === -1) {
        offers.push(bag.splice(at, 1)[0]);
        relicCount += 1;
      } else {
        offers.push(bag.splice(nonRelicAt, 1)[0]);
      }
    } else {
      offers.push(bag.splice(at, 1)[0]);
      if (offer.kind === 'relic') relicCount += 1;
    }
  }
  return offers;
}

export function offerTitle(offer) {
  if (offer.kind === 'reagent') return ELEMENT_BY_ID[offer.id].name;
  if (offer.kind === 'utility') return UTILITIES[offer.id].name;
  if (offer.kind === 'bundle') return 'Tool Bundle';
  return RELICS[offer.id].name;
}

export function offerText(offer) {
  if (offer.kind === 'reagent') {
    const el = ELEMENT_BY_ID[offer.id];
    return `Reagent card. Catalyst: ${el.catalyst}.`;
  }
  if (offer.kind === 'utility') return UTILITIES[offer.id].text;
  if (offer.kind === 'bundle') return 'Stir, Cool and Purge cards for your deck.';
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
  'L = view the Ledger, N = new Ledger (resets the collection).',
];

// Legenda ringkas untuk hub v3b (2 baris): layar hub memuat grid
// koleksi + career + roster sehingga 8 baris TITLE_CONTROLS tidak muat.
// Token kunci sama persis dengan PLAY_CONTROLS_LINE; semantik mulligan
// (2 koin, combo reset) tetap dijelaskan di baris kedua.
export const HUB_CONTROLS = [
  'Click card = play · Click slot = return · Click customer = target · Space = brew · X = dump · M = mute · P = pause',
  'R = mulligan: redraw your hand for 2 coins, combo resets · L = view the Ledger · N = new Ledger (resets the collection)',
];
