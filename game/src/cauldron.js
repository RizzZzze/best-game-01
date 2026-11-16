// cauldron.js — slot kauldron, resolusi brew, dan efek katalis.
// resolveBrew menerapkan HQ-2 (combo naik sebelum pengali), HQ-4 (basi
// mereset combo), dan HQ-6 (Purist + Strange ditolak TANPA mengubah state:
// brew tetap di slot, combo tetap, tangan tidak di-refill — cabang
// 'rejected' di bawah tidak menyentuh satu pun field permainan selain
// umpan balik visual).

import {
  ELEMENT_BY_ID,
  FREEZE_SEC,
  HAND_SIZE,
  MAX_HEARTS,
  NOTICE_DURATION_SEC,
  REACTIONS,
  REJECT_FLASH_SEC,
  dayConfig,
  isElement,
  isRejectedServe,
  sameMultiset,
  serveCoins,
  serveScore,
} from './rules.js';
import { drawCards, drawUp } from './deck.js';
import { PATRON_BY_ID, recordRegularServe } from './regulars.js';

export function createCauldron(slotCount) {
  return {
    slots: new Array(slotCount).fill(null),
    catalyst: null,
  };
}

export function cauldronElements(cauldron) {
  return cauldron.slots.filter((c) => c !== null);
}

export function firstEmptySlot(cauldron) {
  return cauldron.slots.indexOf(null);
}

export function placeInSlot(cauldron, index, cardId) {
  if (!isElement(cardId)) return false;
  if (index < 0 || index >= cauldron.slots.length) return false;
  if (cauldron.slots[index] !== null) return false;
  cauldron.slots[index] = cardId;
  return true;
}

export function placeCatalyst(cauldron, cardId) {
  if (!isElement(cardId)) return false;
  if (cauldron.catalyst !== null) return false;
  cauldron.catalyst = cardId;
  return true;
}

export function takeFromSlot(cauldron, index) {
  if (index < 0 || index >= cauldron.slots.length) return null;
  const card = cauldron.slots[index];
  cauldron.slots[index] = null;
  return card;
}

export function takeCatalyst(cauldron) {
  const card = cauldron.catalyst;
  cauldron.catalyst = null;
  return card;
}

export function clearCauldron(cauldron) {
  const removed = cauldronElements(cauldron);
  cauldron.slots.fill(null);
  return removed;
}

// Buang seluruh isi brew (slot + katalis), kembalikan kartu-kartunya.
// Dipakai X dump dan brew basi. Purge TIDAK memakai ini (lihat main.js).
export function discardBrew(cauldron) {
  const removed = cauldronElements(cauldron);
  if (cauldron.catalyst !== null) removed.push(cauldron.catalyst);
  cauldron.slots.fill(null);
  cauldron.catalyst = null;
  return removed;
}

// Target saji: pelanggan yang dipilih, atau antrean terdepan bila belum ada.
export function getBrewTarget(state) {
  if (state.targetId !== null && state.targetId !== undefined) {
    const found = state.queue.find((c) => c.id === state.targetId);
    if (found) return found;
  }
  return state.queue.length > 0 ? state.queue[0] : null;
}

export function resolveBrew(state) {
  const target = getBrewTarget(state);
  if (!target) return { status: 'no-target' };
  const elements = cauldronElements(state.cauldron);
  if (elements.length === 0) return { status: 'empty' };
  const catalyst = state.cauldron.catalyst;

  // HQ-6: dicek SEBELUM perubahan apa pun. Cabang ini hanya menyetel
  // notice + rejectFlash (umpan balik visual) dan bunyi buzz.
  if (isRejectedServe(target, catalyst)) {
    state.notice = 'Purist refuses Strange!';
    state.noticeLeft = NOTICE_DURATION_SEC;
    state.rejectFlash = REJECT_FLASH_SEC;
    state.audio.buzz();
    return { status: 'rejected', targetId: target.id, catalyst };
  }

  if (!sameMultiset(elements, target.recipe)) {
    const removed = discardBrew(state.cauldron);
    state.discard.push(...removed);
    state.combo = 0;
    state.selected = null;
    state.notice = 'Stale brew! The cauldron is dumped.';
    state.noticeLeft = NOTICE_DURATION_SEC;
    state.audio.buzz();
    return { status: 'spoiled', targetId: target.id, removed };
  }

  // Sajian berhasil. HQ-2: combo naik SEBELUM pengali dihitung.
  state.combo += 1;
  const owned = state.ownedRelics || [];
  const patron = target.patronId ? PATRON_BY_ID[target.patronId] : null;
  const favorite = Boolean(patron && elements.includes(patron.favorite));
  // Glass of the Long Dusk: sajian yang menuntaskan kuota hari itu +10%.
  const lastCustomer = owned.includes('longDuskGlass')
    && state.servedToday + 1 >= dayConfig(state.day).quota;
  // Wax Seal: dendam yang lunas pada sajian sebelumnya memberi +5% pada
  // sajian ini; flag dikonsumsi sajian berhasil apa pun.
  const sealBonus = Boolean(state.sealBonusPending);
  const scoreGained = serveScore(elements.length, state.combo, catalyst);
  const coinsGained = serveCoins(elements.length, {
    ladle: owned.includes('ladle'),
    seared: catalyst === 'cinnabar',
    critic: target.critic,
    purist: target.purist,
    favorite,
    lastCustomer,
    sealBonus,
  });
  if (sealBonus) state.sealBonusPending = false;
  state.score += scoreGained;
  state.coins += coinsGained;
  state.coinsEarned = (state.coinsEarned || 0) + coinsGained;
  // Sajian berhasil mereset streak mulligan (biaya eskalasi 3b kembali ke 2).
  state.mulliganStreak = 0;

  const removed = discardBrew(state.cauldron);
  state.discard.push(...removed);
  const at = state.queue.indexOf(target);
  if (at !== -1) state.queue.splice(at, 1);
  state.servedToday += 1;
  state.selected = null;

  // Regular yang dilayani: kunjungan tercatat, dendam lunas, koin seumur
  // hidup terakumulasi (Fase 2 + Ledger of Small Debts).
  if (target.patronId) recordRegularServe(state, target, elements, coinsGained);

  // Efek katalis, diterapkan setelah skor/koin. Chilled tidak mereset flag
  // warned (peringatan berbunyi sekali per pelanggan).
  if (catalyst === 'moonwell') {
    for (const customer of state.queue) {
      customer.patience = Math.min(
        customer.maxPatience,
        customer.patience + 0.2 * customer.maxPatience,
      );
    }
  } else if (catalyst === 'hivegold') {
    state.hearts = Math.min(MAX_HEARTS, state.hearts + 1);
  } else if (catalyst === 'saltstar') {
    state.freezeLeft = FREEZE_SEC;
  }
  drawUp(state.hand, state.deck, state.discard, state.rng, HAND_SIZE);
  let freshDrawn = [];
  if (catalyst === 'thornroot') {
    freshDrawn = drawCards(state.hand, state.deck, state.discard, 1, state.rng);
  }

  state.targetId = state.queue.length > 0 ? state.queue[0].id : null;
  const reaction = catalyst ? `${REACTIONS[catalyst].name}! ` : '';
  state.notice = `Served! ${reaction}+${scoreGained} score, +${coinsGained} coins.`;
  state.noticeLeft = NOTICE_DURATION_SEC;
  state.audio.chime();
  // Burst visual sajian: splash warna elemen + teks koin mengambang +
  // flare kombo. Visual murni — tidak mengubah satu pun field permainan.
  const splashColors = elements.map((id) => ELEMENT_BY_ID[id].color);
  state.particles.spawnSplash(640, 400, splashColors, state.visualRng, 24);
  state.particles.spawnFloater(`+${coinsGained} coins`, 640, 330, '#e8a558');
  if (state.combo >= 2) {
    state.particles.spawnFlare(640, 400, '#e8a558', 120 + state.combo * 10);
  }
  return { status: 'served', targetId: target.id, scoreGained, coinsGained, catalyst, freshDrawn };
}
