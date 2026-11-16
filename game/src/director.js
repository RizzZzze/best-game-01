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
  SPAWN_INTERVAL_SEC,
  TOTAL_DAYS,
  cauldronSlotCount,
  dayConfig,
  planCriticSlots,
  plannedArrivals,
} from './rules.js';
import { buildDeck, drawUp } from './deck.js';
import { createCauldron } from './cauldron.js';
import { spawnNext, tickQueue } from './customers.js';
import { themeFor } from './render_scene.js';
import { finishDay, loseRun, setNotice } from './states.js';

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
  state.noticeLeft = 0;
  state.rejectFlash = 0;
  const initial = Math.min(INITIAL_SPAWNS, cfg.queueMax);
  for (let i = 0; i < initial; i += 1) {
    spawnNext(state.queue, state.day, state.rng, state.arrivalsSpawned, state.criticSlots);
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
    const spawned = spawnNext(state.queue, state.day, state.rng, state.arrivalsSpawned, state.criticSlots);
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
  const theme = themeFor(state.day);
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
