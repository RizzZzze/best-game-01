// input.js — pointer + keyboard. Meneruskan klik (koordinat game 1280x720)
// dan tombol ke handler main.js. Tidak ada logika game di sini.

import { GAME_HEIGHT, GAME_WIDTH } from './rules.js';

function toGameCoords(canvas, clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const x = ((clientX - rect.left) / rect.width) * GAME_WIDTH;
  const y = ((clientY - rect.top) / rect.height) * GAME_HEIGHT;
  return { x, y };
}

export function bindInput(canvas, handlers) {
  canvas.addEventListener('pointerdown', (event) => {
    const { x, y } = toGameCoords(canvas, event.clientX, event.clientY);
    handlers.onClick(x, y);
  });
  canvas.addEventListener('pointermove', (event) => {
    if (!handlers.onHover) return;
    const { x, y } = toGameCoords(canvas, event.clientX, event.clientY);
    handlers.onHover(x, y);
  });
  window.addEventListener('keydown', (event) => {
    if (event.repeat) return;
    if (event.key === ' ') event.preventDefault();
    handlers.onKey(event.key);
  });
}
