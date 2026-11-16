// particles.js — gelembung kauldron + splash sajian.
// Fase 1: kerangka sistem partikel kosong. Emisi gelembung per elemen dan
// splash diimplementasi di fase art pass.

export class ParticleSystem {
  constructor() {
    this.particles = [];
  }

  spawnBubble(/* x, y, color */) {}
  spawnSplash(/* x, y, colors */) {}
  update(/* dt */) {}
  draw(/* ctx */) {}
  clear() {
    this.particles.length = 0;
  }
}
