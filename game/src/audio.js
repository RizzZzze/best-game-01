// audio.js — sintesis WebAudio murni (tanpa aset).
// Fase 1: kerangka AudioEngine + flag mute. Synth bubble/chime/buzz/tick
// dan loop musik 8 bar diimplementasi di fase audio. Tidak ada AudioContext
// yang dibuat saat modul dimuat, agar aman diuji headless.

export class AudioEngine {
  constructor() {
    this.muted = false;
    this.context = null;
    this.musicStarted = false;
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  ensureContext() {
    // FASE AUDIO: buat AudioContext di sini, setelah gestur pengguna.
    return null;
  }

  bubble() {}
  chime() {}
  buzz() {}
  tick() {}
  startMusic() {}
  stopMusic() {}
}
