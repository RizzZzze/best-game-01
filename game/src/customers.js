// customers.js — antrean, timer kesabaran, dan pembangkit pesanan.

import {
  criticPatience,
  dayConfig,
  generateRecipe,
  rollPurist,
  warningRemaining,
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

// Turunkan patience tiap pelanggan sebesar dt (0 saat freeze). Pelanggan
// yang kesabarannya habis keluar dari antrean dan dikembalikan sebagai
// walkouts. Pelanggan yang baru melewati ambang peringatan dikembalikan
// sebagai newlyWarned (sekali saja, lewat flag warned) agar main.js bisa
// membunyikan tick. Tidak mengubah skor/hati/combo — itu urusan main.js.
export function tickQueue(queue, dt, frozen, hasBell) {
  const walkouts = [];
  const newlyWarned = [];
  if (!frozen) {
    for (let i = queue.length - 1; i >= 0; i -= 1) {
      const customer = queue[i];
      customer.patience = Math.max(0, customer.patience - dt);
      if (customer.patience <= 0) {
        walkouts.push(customer);
        queue.splice(i, 1);
      } else if (
        !customer.warned &&
        customer.patience <= warningRemaining(customer.maxPatience, hasBell)
      ) {
        customer.warned = true;
        newlyWarned.push(customer);
      }
    }
  }
  return { walkouts, newlyWarned };
}
