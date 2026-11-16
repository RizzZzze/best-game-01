// customers.js — antrean, timer kesabaran, dan pembangkit pesanan.

import {
  TWIN_CHANCE,
  criticPatience,
  dayConfig,
  generateRecipeWithFamily,
  rollPurist,
  warningRemaining,
} from './rules.js';
import {
  GRUDGE_PATIENCE_FACTOR,
  REGULAR_CHANCE,
  REGULAR_FIRST_RUN,
  pickPatron,
} from './regulars.js';

let nextCustomerId = 1;

export function resetCustomerIds() {
  nextCustomerId = 1;
}

export function createCustomer(day, rng, opts = {}) {
  const cfg = dayConfig(day);
  const isCritic = Boolean(opts.critic);
  const patronId = opts.patronId || null;
  let maxPatience = isCritic ? criticPatience(cfg.patience) : cfg.patience;
  if (patronId && opts.grudge) maxPatience *= GRUDGE_PATIENCE_FACTOR;
  const { recipe, family } = generateRecipeWithFamily(day, rng, opts.families || []);
  const customer = {
    id: nextCustomerId,
    recipe,
    family,
    patience: maxPatience,
    maxPatience,
    critic: isCritic,
    purist: isCritic || patronId ? false : rollPurist(day, false, rng),
    patronId,
    bonus: Boolean(opts.bonus),
    twin: false,
    warned: false,
  };
  nextCustomerId += 1;
  return customer;
}

// Spawn satu pelanggan berikutnya ke antrean. arrivalIndex adalah nomor
// kedatangan hari itu (0-based); kritik ditentukan planCriticSlots.
// Fase 2: kedatangan non-kritik sejak run ke-2 berkesempatan menjadi
// regular (REGULAR_CHANCE); slot kritik tetap didahulukan dan tidak
// berubah. spawnOpts tanpa ledger/runNumber = perilaku v2 (tamu murni).
// Revisi Fase 2 (roster Xora): spawnOpts.families = famili signature aktif
// (resep templat); spawnOpts.twinAllowed = Aludel dimiliki (twin-order
// menyalin resep pelanggan yang sedang mengantre); spawnOpts.bonusNext =
// kedatangan ini adalah bonus order Charter (bukan slot kritik).
export function spawnNext(queue, day, rng, arrivalIndex, criticSlots, spawnOpts = {}) {
  const cfg = dayConfig(day);
  if (queue.length >= cfg.queueMax) return null;
  const isCriticSlot = criticSlots.includes(arrivalIndex);
  let patronId = null;
  let grudge = false;
  if (
    !isCriticSlot &&
    (spawnOpts.runNumber || 1) >= REGULAR_FIRST_RUN &&
    spawnOpts.ledger &&
    rng() < (spawnOpts.regularChance ?? REGULAR_CHANCE)
  ) {
    const exclude = queue.map((c) => c.patronId).filter(Boolean);
    const patron = pickPatron(rng, exclude);
    if (patron) {
      patronId = patron.id;
      grudge = Boolean(spawnOpts.ledger.regulars?.[patronId]?.grudge);
    }
  }
  const customer = createCustomer(day, rng, {
    critic: isCriticSlot,
    patronId,
    grudge,
    families: spawnOpts.families || [],
    bonus: Boolean(spawnOpts.bonusNext) && !isCriticSlot,
  });
  // Twin-order: salin resep pelanggan yang sedang mengantre (bukan resep
  // segar). Tanpa twinAllowed, tidak ada undian tambahan.
  if (spawnOpts.twinAllowed && queue.length > 0 && rng() < TWIN_CHANCE) {
    const source = queue[Math.floor(rng() * queue.length)];
    customer.recipe = [...source.recipe];
    customer.family = source.family || null;
    customer.twin = true;
  }
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
