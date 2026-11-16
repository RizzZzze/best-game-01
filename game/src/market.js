// market.js — TODAY'S MARKET (Fase 2 v3): seed turunan tanggal kalender
// lokal yang mengubah SATU tema hari dalam run. Variasi ini murni visual
// (langit, ambient, tint HUD pada hari itu); tidak mengubah angka, resep,
// antrean, atau aliran RNG permainan. Tanggal yang sama selalu memberi
// variasi yang sama; tanggal berbeda memberi variasi berbeda.

import { DAY_THEMES, themeFor } from './render_scene.js';

export function dateSeedFor(date) {
  const key = (date.getFullYear() * 372 + (date.getMonth() + 1) * 31 + date.getDate()) >>> 0;
  let h = Math.imul(key ^ (key >>> 16), 0x45d9f3b) >>> 0;
  h = Math.imul(h ^ (h >>> 16), 0x45d9f3b) >>> 0;
  h ^= h >>> 16;
  return h >>> 0;
}

// Variasi hari ini: satu hari (1–10) memakai tema yang SELALU berbeda
// dari tema alaminya (geser 1–4 langkah dari indeks alami).
export function dailyMarketFor(date = new Date()) {
  const seed = dateSeedFor(date);
  const day = ((seed >>> 8) % 10) + 1;
  const natural = DAY_THEMES.indexOf(themeFor(day));
  const themeIndex = (natural + 1 + (seed % (DAY_THEMES.length - 1))) % DAY_THEMES.length;
  return { seed, day, themeIndex };
}

export function marketChipText(daily) {
  if (!daily) return "TODAY'S MARKET: —";
  return `TODAY'S MARKET: ${DAY_THEMES[daily.themeIndex].name} ON DAY ${daily.day}`;
}

// Pratinjau Almanac of Borrowed Days: variasi pasar BESOK, dihitung dari
// tanggal kalender besok. Tanpa efek angka — hanya tampil di title saat
// Almanac tercatat di Ledger.
export function tomorrowMarketFor(date = new Date()) {
  const tomorrow = new Date(date);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return dailyMarketFor(tomorrow);
}

export function tomorrowChipText(daily) {
  if (!daily) return 'TOMORROW: —';
  // Format ringkas ('· DAY') agar chip muat di kolom kiri tanpa menabrak
  // judul tengah (terverifikasi audit visual: format 'ON DAY' 20px meluber).
  return `TOMORROW: ${DAY_THEMES[daily.themeIndex].name} · DAY ${daily.day}`;
}
