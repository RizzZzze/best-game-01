// main.js — bootstrap + loop Alembic Rush.
// Titik masuk browser (index.html memuat modul ini): membaca seed dari URL,
// membuat state, mengikat input, dan menjalankan loop requestAnimationFrame.
// State machine hidup di states.js; penyiapan hari dan langkah simulasi di
// director.js; render di ui.js.
//
// (Pecahan dari main.js lama, Fase 1 v3: hanya bootstrap + loop yang
// tinggal di sini; isi fungsi boot/seedFromUrl tidak berubah.)

import {
  GAME_HEIGHT,
  GAME_WIDTH,
  MAX_HEARTS,
  makeRng,
} from './rules.js';
import { bindInput } from './input.js';
import { drawScreen } from './ui.js';
import { createState, handleClick, handleKey } from './states.js';
import { update } from './director.js';

function seedFromUrl() {
  try {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get('seed');
    if (raw !== null && raw !== '') {
      const n = Number(raw);
      if (Number.isFinite(n)) return n >>> 0;
    }
  } catch {
    // Abaikan: seed default di bawah.
  }
  return (Date.now() % 2147483647) >>> 0;
}

export function boot(canvas) {
  const ctx = canvas.getContext('2d');
  const state = createState(seedFromUrl());
  // Hook tes headless saja: ?test=1 mengekspos state agar tes browser bisa
  // membaca/menyiapkan fixture. Tanpa parameter itu, tidak ada yang terekspos.
  try {
    if (new URLSearchParams(window.location.search).get('test') === '1') {
      window.__alembic = state;
      // Pabrik RNG untuk staging deterministik (reset aliran visual).
      window.__alembicRng = makeRng;
      // Stepper deterministik: satu update + render per panggilan, agar
      // capture dengan jam beku dapat melangkah dalam jumlah frame tetap.
      window.__alembicStep = (dt) => {
        update(state, dt);
        drawScreen(ctx, state);
      };
    }
  } catch {
    // Abaikan: hook tes tidak tersedia di konteks ini.
  }
  bindInput(canvas, {
    // Gestur pertama membuka AudioContext (kebijakan autoplay) + musik.
    onClick: (x, y) => {
      state.audio.unlock();
      handleClick(state, x, y);
    },
    onKey: (key) => {
      state.audio.unlock();
      handleKey(state, key);
    },
    onHover: (x, y) => {
      state.mouse = { x, y };
    },
  });
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    update(state, dt);
    drawScreen(ctx, state);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  return state;
}

// Boot otomatis di browser. Di Node (tes headless) document tidak ada,
// modul ini hanya mengekspor boot.
if (typeof document !== 'undefined') {
  const canvas = document.getElementById('game');
  if (canvas) boot(canvas);
}

export { GAME_HEIGHT, GAME_WIDTH, MAX_HEARTS };
