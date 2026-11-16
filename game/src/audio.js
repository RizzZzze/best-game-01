// audio.js — sintesis WebAudio murni (tanpa aset).
// Suara sesuai brief: bubble pop per elemen saat kartu dimainkan, chime
// saat sajian berhasil, buzz saat basi/ditolak, tick peringatan saat
// kesabaran <25%, dan loop musik lembut 8 bar. M = mute via master gain.
// AudioContext dibuat malas (lazy) pada gestur pengguna pertama agar
// kebijakan autoplay browser terpenuhi; tanpa AudioContext (Node/tes)
// semua metode aman no-op kecuali pencatatan event.

export const BUBBLE_PITCH = {
  cinnabar: 523.25, // C5
  moonwell: 659.25, // E5
  thornroot: 440.0, // A4
  hivegold: 783.99, // G5
  gloomcap: 329.63, // E4
  saltstar: 880.0, // A5
};
export const BUBBLE_PITCH_DEFAULT = 587.33; // D5, untuk kartu non-elemen

export const MUSIC_TEMPO_BPM = 76;
export const MUSIC_BEATS = 32; // 8 bar x 4/4

// Progresi akor per bar (8 bar): Am - F - C - G - Am - F - C - G.
const MUSIC_CHORDS = [
  [110.0, 164.81, 220.0],
  [87.31, 130.81, 174.61],
  [130.81, 164.81, 196.0],
  [98.0, 123.47, 146.83],
  [110.0, 164.81, 220.0],
  [87.31, 130.81, 174.61],
  [130.81, 164.81, 196.0],
  [98.0, 123.47, 146.83],
];

// Melodi pentatonik A minor, satu nada per ketuk yang terisi (null = diam).
const MUSIC_MELODY = new Array(MUSIC_BEATS).fill(null);
MUSIC_MELODY[0] = 440.0;
MUSIC_MELODY[2] = 523.25;
MUSIC_MELODY[4] = 659.25;
MUSIC_MELODY[6] = 587.33;
MUSIC_MELODY[8] = 523.25;
MUSIC_MELODY[11] = 440.0;
MUSIC_MELODY[12] = 587.33;
MUSIC_MELODY[14] = 659.25;
MUSIC_MELODY[16] = 783.99;
MUSIC_MELODY[18] = 659.25;
MUSIC_MELODY[20] = 587.33;
MUSIC_MELODY[22] = 523.25;
MUSIC_MELODY[24] = 440.0;
MUSIC_MELODY[26] = 523.25;
MUSIC_MELODY[28] = 587.33;
MUSIC_MELODY[30] = 440.0;

export class AudioEngine {
  constructor() {
    this.muted = false;
    this.context = null;
    this.master = null;
    this.musicStarted = false;
    this.musicTimer = null;
    this.nextBeat = 0;
    this.nextBeatTime = 0;
    this.beatsScheduled = 0;
    this.nodesCreated = 0;
    this.events = [];
  }

  logEvent(name, detail = null) {
    this.events.push({ name, detail });
    if (this.events.length > 200) this.events.shift();
  }

  ensureContext() {
    if (this.context) return this.context;
    const Ctor =
      typeof globalThis !== 'undefined'
        ? globalThis.AudioContext || globalThis.webkitAudioContext
        : null;
    if (!Ctor) return null;
    try {
      this.context = new Ctor();
    } catch {
      return null;
    }
    this.master = this.context.createGain();
    this.master.gain.value = this.muted ? 0 : 1;
    this.master.connect(this.context.destination);
    return this.context;
  }

  // Dipanggil dari gestur pengguna (klik/tombol): buat/resume konteks
  // lalu mulai loop musik. Idempotent.
  unlock() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    if (ctx.state === 'suspended' && typeof ctx.resume === 'function') {
      const result = ctx.resume();
      if (result && typeof result.catch === 'function') result.catch(() => {});
    }
    this.startMusic();
  }

  setMuted(muted) {
    this.muted = muted;
    if (this.master) this.master.gain.value = muted ? 0 : 1;
    return this.muted;
  }

  toggleMute() {
    return this.setMuted(!this.muted);
  }

  // Satu nada synth: osilator + amplop gain ke master. Mengembalikan
  // osilator, atau null bila tidak ada konteks / sedang mute.
  tone({ freq, freqEnd = null, type = 'sine', dur = 0.15, gain = 0.15, when = 0, attack = 0.005 }) {
    const ctx = this.ensureContext();
    if (!ctx || this.muted) return null;
    const t = ctx.currentTime + when;
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (freqEnd !== null) osc.frequency.exponentialRampToValueAtTime(freqEnd, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g);
    g.connect(this.master);
    osc.start(t);
    osc.stop(t + dur + 0.05);
    this.nodesCreated += 1;
    return osc;
  }

  // Pop gelembung: pitch jatuh cepat, beda per elemen.
  bubble(elementId = null) {
    const pitch = BUBBLE_PITCH[elementId] || BUBBLE_PITCH_DEFAULT;
    this.logEvent('bubble', elementId);
    this.tone({ freq: pitch * 1.5, freqEnd: pitch, type: 'sine', dur: 0.12, gain: 0.22 });
  }

  // Chime sajian: dua nada naik (E5 -> B5).
  chime() {
    this.logEvent('chime');
    this.tone({ freq: 659.25, type: 'triangle', dur: 0.35, gain: 0.18 });
    this.tone({ freq: 987.77, type: 'triangle', dur: 0.4, gain: 0.16, when: 0.07 });
  }

  // Buzz basi/penolakan: sawtooth rendah menurun.
  buzz() {
    this.logEvent('buzz');
    this.tone({ freq: 140, freqEnd: 90, type: 'sawtooth', dur: 0.25, gain: 0.16 });
  }

  // Tick peringatan: klik pendek bernada tinggi.
  tick() {
    this.logEvent('tick');
    this.tone({ freq: 1200, type: 'square', dur: 0.05, gain: 0.07 });
  }

  scheduleBeat(beat, time) {
    const beatDur = 60 / MUSIC_TEMPO_BPM;
    if (beat % 4 === 0) {
      const chord = MUSIC_CHORDS[Math.floor(beat / 4) % MUSIC_CHORDS.length];
      for (const freq of chord) {
        this.tone({
          freq,
          type: 'triangle',
          dur: beatDur * 4,
          gain: 0.032,
          when: time - this.context.currentTime,
          attack: 0.25,
        });
      }
    }
    const melody = MUSIC_MELODY[beat];
    if (melody !== null) {
      this.tone({
        freq: melody,
        type: 'sine',
        dur: 0.5,
        gain: 0.05,
        when: time - this.context.currentTime,
      });
    }
  }

  // Scheduler lookahead: jadwalkan ketuk sampai 0,35 dtk ke depan.
  scheduleMusic() {
    const ctx = this.context;
    if (!ctx || !this.musicStarted) return;
    const beatDur = 60 / MUSIC_TEMPO_BPM;
    while (this.nextBeatTime < ctx.currentTime + 0.35) {
      this.scheduleBeat(this.nextBeat, this.nextBeatTime);
      this.beatsScheduled += 1;
      this.nextBeat = (this.nextBeat + 1) % MUSIC_BEATS;
      this.nextBeatTime += beatDur;
    }
  }

  startMusic() {
    const ctx = this.ensureContext();
    if (!ctx || this.musicStarted) return;
    this.musicStarted = true;
    this.nextBeat = 0;
    this.nextBeatTime = ctx.currentTime + 0.1;
    this.scheduleMusic();
    if (typeof setInterval === 'function') {
      this.musicTimer = setInterval(() => this.scheduleMusic(), 100);
    }
  }

  stopMusic() {
    this.musicStarted = false;
    if (this.musicTimer !== null && typeof clearInterval === 'function') {
      clearInterval(this.musicTimer);
    }
    this.musicTimer = null;
  }
}
