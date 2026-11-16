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
    return isValidLedger(parsed) ? parsed : freshLedger();
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
export function recordRunEnd(ledger, { score, rank, day }) {
  if (!ledger) return;
  ledger.runsCompleted += 1;
  if (!ledger.bestRun || score > ledger.bestRun.score) {
    ledger.bestRun = { score, rank, day };
  }
}
