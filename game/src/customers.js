// customers.js — antrean, timer kesabaran, dan pembangkit pesanan.
// Fase 1: konstruksi pelanggan + spawn. tickQueue (penurunan kesabaran dan
// walk-out) diimplementasi penuh di fase 2 (loop playable).

import {
  criticPatience,
  dayConfig,
  generateRecipe,
  rollPurist,
} from './rules.js';

let nextCustomerId = 1;

export function resetCustomerIds() {
  nextCustomerId = 1;
}

export function createCustomer(day, rng, opts = {}) {
  const cfg = dayConfig(day);
  const isCritic = Boolean(opts.critic);
  const maxPatience = isCritic ? criticPatience(cfg.patience) : cfg.patience;
  const customer = {
    id: nextCustomerId,
    recipe: generateRecipe(day, rng),
    patience: maxPatience,
    maxPatience,
    critic: isCritic,
    purist: isCritic ? false : rollPurist(day, false, rng),
    warned: false,
  };
  nextCustomerId += 1;
  return customer;
}

// Spawn satu pelanggan berikutnya ke antrean. arrivalIndex adalah nomor
// kedatangan hari itu (0-based); kritik ditentukan planCriticSlots.
export function spawnNext(queue, day, rng, arrivalIndex, criticSlots) {
  const cfg = dayConfig(day);
  if (queue.length >= cfg.queueMax) return null;
  const customer = createCustomer(day, rng, {
    critic: criticSlots.includes(arrivalIndex),
  });
  queue.push(customer);
  return customer;
}

// FASE 2: turunkan patience tiap pelanggan sebesar dt (0 saat freeze),
// kembalikan daftar walk-out, tandai warned saat melewati ambang.
// Stub fase 1: antrean statis, tidak ada walk-out.
export function tickQueue(/* queue, dt, frozen, hasBell */) {
  return [];
}
