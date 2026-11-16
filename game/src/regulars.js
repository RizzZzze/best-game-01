// regulars.js — enam patron bernama (Fase 2 v3). Setiap patron punya
// elemen favorit: sajian yang mengandung favoritnya membayar +10% koin
// (plafon efek meta). Bila seorang regular pernah walk-out, ia menyimpan
// dendam: kesabaran −10% sampai dilayani lagi. Kunjungan tercatat di
// Ledger; mood diturunkan dari catatan (bukan state tersimpan sendiri).
// Regular hanya muncul sejak run ke-2; run pertama tetap tamu murni.

import { saveLedger } from './ledger.js';

export const PATRONS = [
  { id: 'vex', name: 'Madame Vex', short: 'Vex', favorite: 'gloomcap', accent: '#9a6ee8' },
  { id: 'bram', name: 'Bram Hollow', short: 'Bram', favorite: 'cinnabar', accent: '#e5484d' },
  { id: 'ilse', name: 'Sister Ilse', short: 'Ilse', favorite: 'moonwell', accent: '#3e9bff' },
  { id: 'quill', name: 'Quill the Cartographer', short: 'Quill', favorite: 'saltstar', accent: '#c8d4e0' },
  { id: 'marrow', name: 'Widow Marrow', short: 'Marrow', favorite: 'thornroot', accent: '#3fb970' },
  { id: 'pip', name: 'Pip the Apprentice', short: 'Pip', favorite: 'hivegold', accent: '#f2b234' },
];

export const PATRON_BY_ID = Object.fromEntries(PATRONS.map((p) => [p.id, p]));

export const REGULAR_CHANCE = 0.25;
export const REGULAR_FIRST_RUN = 2;
export const FAVORITE_COIN_BONUS = 0.1;
export const GRUDGE_PATIENCE_FACTOR = 0.9;
export const DEVOTED_VISITS = 5;

export function patronRecord(ledger, patronId) {
  if (!ledger.regulars[patronId]) {
    ledger.regulars[patronId] = { visits: 0, grudge: false, coins: 0 };
  }
  const record = ledger.regulars[patronId];
  if (typeof record.coins !== 'number') record.coins = 0;
  return record;
}

export function moodFor(record) {
  if (!record || record.visits === 0) return 'New';
  if (record.grudge) return 'Grumpy';
  if (record.visits >= DEVOTED_VISITS) return 'Devoted';
  return 'Warm';
}

export function moodColor(mood) {
  if (mood === 'Devoted') return '#3fb970';
  if (mood === 'Warm') return '#e8a558';
  if (mood === 'Grumpy') return '#e5484d';
  return '#8a7a68';
}

// Jumlah patron yang pernah dilayani setidaknya sekali (chip REGULARS x/6).
export function metCount(ledger) {
  if (!ledger) return 0;
  return PATRONS.filter((p) => (ledger.regulars[p.id]?.visits || 0) > 0).length;
}

// Pilih patron yang belum ada di antrean. Mengembalikan null bila semua
// patron sedang mengantre (spawn jatuh kembali ke tamu biasa).
export function pickPatron(rng, excludeIds) {
  const candidates = PATRONS.filter((p) => !excludeIds.includes(p.id));
  if (candidates.length === 0) return null;
  return candidates[Math.floor(rng() * candidates.length)];
}

// Dipanggil dari resolveBrew setelah sajian berhasil terhadap regular:
// kunjungan +1, dendam lunas, koin seumur hidup terakumulasi (Ledger of
// Small Debts menampilkannya), pelacakan run untuk footer win. Bila
// dendam lunas saat Wax Seal dimiliki, sajian BERIKUTNYA mendapat +5%
// koin (flag sealBonusPending, dikonsumsi resolveBrew).
export function recordRegularServe(state, target, elements, coinsGained = 0) {
  const patron = PATRON_BY_ID[target.patronId];
  if (!patron || !state.ledger) return false;
  const record = patronRecord(state.ledger, patron.id);
  const firstVisit = record.visits === 0;
  const hadGrudge = record.grudge === true;
  record.visits += 1;
  record.grudge = false;
  record.coins += coinsGained;
  saveLedger(state.ledger);
  if (hadGrudge && (state.ownedRelics || []).includes('waxSeal')) {
    state.sealBonusPending = true;
  }
  if (typeof state.runRegularVisits === 'number') state.runRegularVisits += 1;
  if (firstVisit && Array.isArray(state.runNewRegulars)) {
    state.runNewRegulars.push(patron.id);
  }
  return elements.includes(patron.favorite);
}

// Dipanggil dari update() saat seorang regular walk-out: dendam tercatat.
export function recordRegularWalkout(state, customer) {
  if (!customer.patronId || !state.ledger) return;
  const record = patronRecord(state.ledger, customer.patronId);
  record.grudge = true;
  saveLedger(state.ledger);
}
