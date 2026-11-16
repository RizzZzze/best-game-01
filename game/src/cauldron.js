// cauldron.js — slot kauldron, resolusi brew, dan efek katalis.
// Fase 1: wadah slot + place/return murni. resolveBrew diimplementasi penuh
// di fase 2 (loop playable) dan WAJIB memakai isRejectedServe dari rules.js
// untuk aturan HQ-6: Purist + Strange ditolak TANPA mengubah state
// (brew tetap di slot, combo tetap, tangan tidak di-refill).

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
  if (index < 0 || index >= cauldron.slots.length) return false;
  if (cauldron.slots[index] !== null) return false;
  cauldron.slots[index] = cardId;
  return true;
}

export function placeCatalyst(cauldron, cardId) {
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

// FASE 2: resolveBrew(state) — cocokkan multiset slot vs resep target,
// terapkan HQ-2/HQ-4/HQ-6, skor/koin, efek katalis, refill tangan.
export function resolveBrew() {
  return { status: 'not-implemented' };
}
