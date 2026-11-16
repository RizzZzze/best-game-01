// director.js — sutradara hari: penyiapan hari, antrean kedatangan,
// kuota, event (banner Critic), dan langkah simulasi per frame.
// beginDay menyiapkan deck/tangan/antrean awal; update() menjalankan
// tick antrean, spawn terjadwal, pemeriksaan kuota/soft-lock, dan emisi
// visual (gelembung + partikel ambient lewat RNG visual). Transisi layar
// (finishDay/loseRun) dan aksi pemain hidup di states.js.
//
// (Pecahan dari main.js, Fase 1 v3: pindah verbatim.)

import {
  ELEMENT_BY_ID,
  INITIAL_SPAWNS,
  LONG_CANDLE_BONUS_SEC,
  POUCH_RELICS,
  PURIST_VEIL_BONUS_SEC,
  SPAWN_INTERVAL_SEC,
  TOTAL_DAYS,
  WELCOME_MAT_BONUS_SEC,
  cauldronSlotCount,
  dayConfig,
  planCriticSlots,
  plannedArrivals,
} from './rules.js';
import { buildDeck, drawUp } from './deck.js';
import { createCauldron } from './cauldron.js';
import { spawnNext, tickQueue } from './customers.js';
import { effectiveThemeFor } from './render_scene.js';
import { recordRegularWalkout } from './regulars.js';
import { finishDay, loseRun, setNotice } from './states.js';

// Opsi spawn regular (Fase 2): run >= 2 + Ledger aktif -> pelanggan bisa
// menjadi patron bernama. Run 1 / tanpa Ledger = tamu murni seperti v2.
function spawnOptions(state) {
  return {
    runNumber: state.runNumber || 1,
    ledger: state.ledger || null,
  };
}

// Bonus kesabaran saat spawn (relic tier 1/3): Long Candle untuk semua,
// Purist's Veil khusus Purist. Diterapkan ke patience DAN maxPatience
// agar ambang peringatan ikut skala. Diekspor untuk pengujian.
export function applySpawnBonuses(state, customer) {
  const owned = state.ownedRelics || [];
  let bonus = 0;
  if (owned.includes('longCandle')) bonus += LONG_CANDLE_BONUS_SEC;
  if (customer.purist && owned.includes('puristVeil')) bonus += PURIST_VEIL_BONUS_SEC;
  if (bonus > 0) {
    customer.maxPatience += bonus;
    customer.patience += bonus;
  }
  return customer;
}

// Siapkan hari: deck dikocok, tangan ditarik, kauldron kosong, antrean awal.
export function beginDay(state) {
  const cfg = dayConfig(state.day);
  const owned = state.ownedRelics || [];
  // Relic kantong: +1 salinan elemennya di deck SETIAP hari (pool saja).
  const bonusCards = [];
  for (const [elementId, relicId] of Object.entries(POUCH_RELICS)) {
    if (owned.includes(relicId)) bonusCards.push(elementId);
  }
  state.deck = buildDeck(state.day, [...state.extraCards, ...bonusCards], state.rng);
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
  state.noticeLeft = 0;
  state.rejectFlash = 0;
  const initial = Math.min(INITIAL_SPAWNS, cfg.queueMax);
  for (let i = 0; i < initial; i += 1) {
    const spawned = spawnNext(state.queue, state.day, state.rng, state.arrivalsSpawned, state.criticSlots, spawnOptions(state));
    if (spawned) {
      applySpawnBonuses(state, spawned);
      // Welcome Mat: kedatangan pertama hari itu saja yang +5s.
      if (i === 0 && owned.includes('welcomeMat')) {
        spawned.maxPatience += WELCOME_MAT_BONUS_SEC;
        spawned.patience += WELCOME_MAT_BONUS_SEC;
      }
    }
    state.arrivalsSpawned += 1;
  }
  if (state.queue.length > 0) state.targetId = state.queue[0].id;
  state.screen = 'play';
  state.paused = false;
  return state;
}

// Satu langkah simulasi. Dipanggil tiap frame dari loop browser; bisa juga
// dipanggil langsung dari tes headless.
export function update(state, dt) {
  if (state.paused) return state;
  state.animTime = (state.animTime || 0) + dt;
  if (state.noticeLeft > 0) state.noticeLeft = Math.max(0, state.noticeLeft - dt);
  if (state.rejectFlash > 0) state.rejectFlash = Math.max(0, state.rejectFlash - dt);
  if (state.eventBannerLeft > 0) state.eventBannerLeft = Math.max(0, state.eventBannerLeft - dt);
  if (state.screen !== 'play') return state;
  if (state.freezeLeft > 0) {
    state.freezeLeft = Math.max(0, state.freezeLeft - dt);
  }
  const frozen = state.freezeLeft > 0;
  const { walkouts, newlyWarned } = tickQueue(
    state.queue,
    dt,
    frozen,
    state.ownedRelics.includes('bell'),
  );
  for (const customer of newlyWarned) {
    state.audio.tick();
  }
  for (const gone of walkouts) {
    state.hearts -= 1;
    state.combo = 0; // HQ-3: walk-out mereset combo.
    state.lostToday += 1;
    if (gone.patronId) recordRegularWalkout(state, gone);
  }
  if (walkouts.length > 0) {
    setNotice(state, 'A customer walked out! -1 heart, combo reset.');
    state.audio.buzz();
    if (!state.queue.some((c) => c.id === state.targetId)) {
      state.targetId = state.queue.length > 0 ? state.queue[0].id : null;
    }
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
    const spawned = spawnNext(state.queue, state.day, state.rng, state.arrivalsSpawned, state.criticSlots, spawnOptions(state));
    if (spawned) applySpawnBonuses(state, spawned);
    state.arrivalsSpawned += 1;
    if (spawned && spawned.critic) {
      state.eventBanner = '★ A CRITIC ARRIVES — double coins, half patience!';
      state.eventBannerLeft = 3;
    }
    if (state.targetId === null && state.queue.length > 0) {
      state.targetId = state.queue[0].id;
    }
  }
  if (state.servedToday >= cfg.quota) {
    return finishDay(state);
  }
  // Perbaikan soft-lock (putusan Xora): hari berakhir saat antrean kosong
  // DAN kedatangan habis, meski kuota belum tercapai — permainan tidak
  // boleh menggantung. Hari 10 tanpa kuota = kalah; menang hanya bila
  // kuota hari 10 terpenuhi.
  if (
    state.queue.length === 0 &&
    state.arrivalsSpawned >= state.arrivalsPlanned &&
    state.servedToday < cfg.quota
  ) {
    if (state.day >= TOTAL_DAYS) {
      return loseRun(state, 'Day 10 ended with the quota unmet — the queue ran dry.');
    }
    return finishDay(state);
  }
  // Emisi gelembung kauldron: warna dari elemen yang sedang terisi.
  // RNG visual (bukan state.rng) agar visual tidak menggeser resep/antrean.
  const filled = state.cauldron.slots.filter(Boolean);
  const vrng = state.visualRng || Math.random;
  if (filled.length > 0) {
    state.bubbleTimer += dt;
    if (state.bubbleTimer >= 0.15) {
      state.bubbleTimer = 0;
      const cardId = filled[Math.floor(vrng() * filled.length)];
      state.particles.spawnBubble(
        640 + (vrng() - 0.5) * 90,
        430,
        ELEMENT_BY_ID[cardId].color,
        vrng,
      );
    }
  }
  // Partikel ambient tema (hujan/ember/mote) lewat RNG visual yang sama.
  // Tema efektif menghormati TODAY'S MARKET (visual saja).
  const theme = effectiveThemeFor(state.day, state.dailyMarket);
  state.ambientTimer += dt;
  if (state.ambientTimer >= 0.12) {
    state.ambientTimer = 0;
    if (theme.ambient === 'rain') {
      // Hujan butuh kerapatan ganda agar terbaca sebagai hujan.
      state.particles.spawnAmbient('rain', vrng() * 1280, -10, vrng, theme.ambientColor);
      state.particles.spawnAmbient('rain', vrng() * 1280, -10, vrng, theme.ambientColor);
    } else if (theme.ambient === 'ember') {
      state.particles.spawnAmbient('ember', vrng() * 1280, 730, vrng, theme.ambientColor);
    } else {
      state.particles.spawnAmbient('mote', vrng() * 1280, 100 + vrng() * 500, vrng, theme.ambientColor);
    }
  }
  state.particles.update(dt);
  return state;
}
