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
  FOG_THEME_IDS,
  INITIAL_SPAWNS,
  PARADE_PATIENCE_FACTOR,
  RAIN_PATIENCE_FACTOR,
  SPAWN_INTERVAL_SEC,
  THEME_VARIANT_CHANCE,
  TOTAL_DAYS,
  VARIANT_RELICS,
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
// Revisi Fase 2: famili signature (dibekukan saat run dimulai), twin
// (Aludel dimiliki), dan bonus order (Charter + fog day, satu per hari).
function spawnOptions(state) {
  return {
    runNumber: state.runNumber || 1,
    ledger: state.ledger || null,
    families: state.signatureFamilies || [],
    twinAllowed: (state.ownedRelics || []).includes('nineNecks'),
    bonusNext: (state.bonusPending || 0) > 0,
  };
}

// Undian varian tema hari ini: bila ada relic varian yang dimiliki, peluang
// THEME_VARIANT_CHANCE hari memakai salah satu varian aktif (acak seragam).
// Tanpa relic varian, tidak ada undian — aliran RNG persis v2.
export function rollDayVariant(state) {
  const owned = state.ownedRelics || [];
  const active = Object.entries(VARIANT_RELICS)
    .filter(([, relicId]) => owned.includes(relicId))
    .map(([variantId]) => variantId);
  if (active.length === 0) return null;
  if (state.rng() >= THEME_VARIANT_CHANCE) return null;
  return active[Math.floor(state.rng() * active.length)];
}

// Bonus kesabaran saat spawn: hari QUIET RAIN (varian Cucurbit) memberi
// +5% kesabaran untuk semua kedatangan. Diterapkan ke patience DAN
// maxPatience agar ambang peringatan ikut skala. Diekspor untuk pengujian.
export function applySpawnBonuses(state, customer) {
  const theme = effectiveThemeFor(state.day, state.dailyMarket, state.dayVariant || null);
  if (theme.id === 'quietRain') {
    customer.maxPatience *= RAIN_PATIENCE_FACTOR;
    customer.patience *= RAIN_PATIENCE_FACTOR;
  }
  return customer;
}

// Siapkan hari: deck dikocok, tangan ditarik, kauldron kosong, antrean awal.
// Urutan undian: varian tema -> slot kritik (bonus Blood Moon) -> spawn.
export function beginDay(state) {
  const cfg = dayConfig(state.day);
  const owned = state.ownedRelics || [];
  state.dayVariant = rollDayVariant(state);
  const theme = effectiveThemeFor(state.day, state.dailyMarket, state.dayVariant);
  // Vial of the Blood Moon: hari rite menambah 1 slot kritik.
  const extraCritics = theme.id === 'bloodMoonRite' ? 1 : 0;
  // Charter of the Fog Guild: satu bonus order pada fog day.
  state.bonusPending = FOG_THEME_IDS.includes(theme.id) && owned.includes('fogCharter') ? 1 : 0;
  state.deck = buildDeck(state.day, [...state.extraCards], state.rng);
  state.hand = [];
  state.discard = [];
  drawUp(state.hand, state.deck, state.discard, state.rng);
  state.cauldron = createCauldron(cauldronSlotCount(state.ownedRelics));
  state.queue = [];
  state.arrivalsSpawned = 0;
  state.arrivalsPlanned = plannedArrivals(state.day);
  state.criticSlots = planCriticSlots(state.day, state.rng, extraCritics);
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
  // Parade Pip: gelombang awal pertama sejak Whistle dimiliki mendapat
  // +5% kesabaran, sekali per run.
  const parade = owned.includes('pipWhistle') && !state.paradeDone;
  for (let i = 0; i < initial; i += 1) {
    const spawned = spawnNext(state.queue, state.day, state.rng, state.arrivalsSpawned, state.criticSlots, spawnOptions(state));
    if (spawned) {
      applySpawnBonuses(state, spawned);
      if (parade) {
        spawned.maxPatience *= PARADE_PATIENCE_FACTOR;
        spawned.patience *= PARADE_PATIENCE_FACTOR;
      }
      if (spawned.bonus) state.bonusPending = 0;
    }
    state.arrivalsSpawned += 1;
  }
  if (parade && state.queue.length > 0) {
    state.paradeDone = true;
    state.eventBanner = "Pip's parade rolls through the market! +5% patience.";
    state.eventBannerLeft = 3;
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
  // Bonus order (Charter) yang walk-out: benar-benar opsional — tanpa
  // kehilangan hati, tanpa reset combo, tanpa dendam, tanpa hitungan lost.
  const realWalkouts = walkouts.filter((c) => !c.bonus);
  for (const gone of realWalkouts) {
    state.hearts -= 1;
    state.combo = 0; // HQ-3: walk-out mereset combo.
    state.lostToday += 1;
    if (gone.patronId) recordRegularWalkout(state, gone);
  }
  if (realWalkouts.length > 0) {
    setNotice(state, 'A customer walked out! -1 heart, combo reset.');
    state.audio.buzz();
  }
  if (walkouts.length > 0) {
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
    if (spawned) {
      applySpawnBonuses(state, spawned);
      if (spawned.bonus) state.bonusPending = 0;
    }
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
  // Partikel ambient tema (hujan/ember/mote/salju) lewat RNG visual yang sama.
  // Tema efektif menghormati TODAY'S MARKET + varian hari (visual saja).
  const theme = effectiveThemeFor(state.day, state.dailyMarket, state.dayVariant || null);
  state.ambientTimer += dt;
  if (state.ambientTimer >= 0.12) {
    state.ambientTimer = 0;
    if (theme.ambient === 'rain') {
      // Hujan butuh kerapatan ganda agar terbaca sebagai hujan.
      state.particles.spawnAmbient('rain', vrng() * 1280, -10, vrng, theme.ambientColor);
      state.particles.spawnAmbient('rain', vrng() * 1280, -10, vrng, theme.ambientColor);
    } else if (theme.ambient === 'ember') {
      state.particles.spawnAmbient('ember', vrng() * 1280, 730, vrng, theme.ambientColor);
    } else if (theme.ambient === 'snow') {
      state.particles.spawnAmbient('snow', vrng() * 1280, -10, vrng, theme.ambientColor);
      state.particles.spawnAmbient('snow', vrng() * 1280, -10, vrng, theme.ambientColor);
    } else {
      state.particles.spawnAmbient('mote', vrng() * 1280, 100 + vrng() * 500, vrng, theme.ambientColor);
    }
    // Kunang-kunang (Jar): tema malam + stoples dimiliki, tiap ~0,5 dtk.
    if (theme.night && (state.ownedRelics || []).includes('fireflyJar')) {
      state.fireflyTick = (state.fireflyTick || 0) + 1;
      if (state.fireflyTick % 4 === 0) {
        state.particles.spawnAmbient('firefly', vrng() * 1280, 150 + vrng() * 400, vrng);
      }
    }
  }
  state.particles.update(dt);
  return state;
}
