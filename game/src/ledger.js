// ledger.js — The Ledger: persistensi meta antar-run (Fase 2 v3).
// Koleksi relic permanen (24 slot), riwayat kunjungan regular, best run,
// dan hitungan run. Disimpan berversi di localStorage; data rusak atau
// versi lama kembali ke ledger segar. Tidak menyentuh RNG permainan:
// Ledger hanya mencatat, tidak pernah mengundi.

export const LEDGER_KEY = 'alembic-rush-ledger';
export const LEDGER_VERSION = 1;
export const LEDGER_SIZE = 24;

export function freshLedger() {
  return {
    version: LEDGER_VERSION,
    relics: [],
    regulars: {},
    bestRun: null,
    runsCompleted: 0,
    // Stempel sejarah (roster Xora): hitungan market day (Mortar) dan
    // skor run pertama (Receipt) — sekali tercatat, tidak pernah berubah.
    marketStamps: 0,
    firstRunScore: null,
  };
}

function defaultStorage() {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

function isValidLedger(value) {
  return (
    value !== null &&
    typeof value === 'object' &&
    value.version === LEDGER_VERSION &&
    Array.isArray(value.relics) &&
    value.relics.every((id) => typeof id === 'string') &&
    value.regulars !== null &&
    typeof value.regulars === 'object' &&
    !Array.isArray(value.regulars) &&
    typeof value.runsCompleted === 'number'
  );
}

export function loadLedger(storage = defaultStorage()) {
  if (!storage) return freshLedger();
  try {
    const raw = storage.getItem(LEDGER_KEY);
    if (!raw) return freshLedger();
    const parsed = JSON.parse(raw);
    if (!isValidLedger(parsed)) return freshLedger();
    // Normalisasi aditif: simpanan lama tanpa field baru tetap valid.
    if (typeof parsed.marketStamps !== 'number') parsed.marketStamps = 0;
    if (typeof parsed.firstRunScore !== 'number') parsed.firstRunScore = null;
    for (const record of Object.values(parsed.regulars)) {
      if (record && typeof record === 'object') {
        if (typeof record.visits !== 'number') record.visits = 0;
        if (typeof record.grudge !== 'boolean') record.grudge = false;
        if (typeof record.coins !== 'number') record.coins = 0;
      }
    }
    return parsed;
  } catch {
    return freshLedger();
  }
}

export function saveLedger(ledger, storage = defaultStorage()) {
  if (!storage) return;
  try {
    storage.setItem(LEDGER_KEY, JSON.stringify(ledger));
  } catch {
    // Penyimpanan penuh/diblokir: permainan jalan tanpa persistensi.
  }
}

// Reset adil (tombol New Ledger): ledger segar langsung disimpan.
export function resetLedger(storage = defaultStorage()) {
  const fresh = freshLedger();
  saveLedger(fresh, storage);
  return fresh;
}

export function ledgerCount(ledger) {
  return ledger && Array.isArray(ledger.relics) ? ledger.relics.length : 0;
}

// Catat relic yang ditemukan (dibeli) dalam run. Mengembalikan true bila
// relic ini BARU bagi Ledger (untuk footer LEDGER UPDATED di layar win).
export function recordRelic(ledger, id) {
  if (!ledger || ledger.relics.includes(id)) return false;
  ledger.relics.push(id);
  return true;
}

// Dipanggil tepat sekali saat sebuah run berakhir (menang atau kalah).
// Run pertama juga menstempel skornya secara permanen (Receipt).
export function recordRunEnd(ledger, { score, rank, day }) {
  if (!ledger) return;
  if (ledger.runsCompleted === 0 && ledger.firstRunScore == null) {
    ledger.firstRunScore = score;
  }
  ledger.runsCompleted += 1;
  if (!ledger.bestRun || score > ledger.bestRun.score) {
    ledger.bestRun = { score, rank, day };
  }
}
