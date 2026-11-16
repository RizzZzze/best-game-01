// deck.js — shuffle, draw, dan komposisi deck per hari.
// Deck dibangun ulang + dikocok di awal tiap hari dari komposisi yang
// dimiliki (deckComposition di rules.js). Saat deck habis, discard dikocok
// kembali menjadi deck.

import { HAND_SIZE, deckComposition } from './rules.js';

export function shuffleInPlace(deck, rng) {
  for (let i = deck.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = deck[i];
    deck[i] = deck[j];
    deck[j] = tmp;
  }
  return deck;
}

export function buildDeck(day, extraCards, rng) {
  return shuffleInPlace(deckComposition(day, extraCards), rng);
}

function reshuffleIfNeeded(deck, discard, rng) {
  if (deck.length === 0 && discard.length > 0) {
    deck.push(...discard.splice(0, discard.length));
    shuffleInPlace(deck, rng);
  }
}

// Tarik sampai tangan penuh (HAND_SIZE). Mengembalikan kartu yang ditarik.
export function drawUp(hand, deck, discard, rng, handSize = HAND_SIZE) {
  const drawn = [];
  while (hand.length < handSize) {
    reshuffleIfNeeded(deck, discard, rng);
    if (deck.length === 0) break;
    const card = deck.pop();
    hand.push(card);
    drawn.push(card);
  }
  return drawn;
}

// Tarik tepat `count` kartu (efek Fresh/Stir). Boleh melebihi HAND_SIZE.
export function drawCards(hand, deck, discard, count, rng) {
  const drawn = [];
  for (let i = 0; i < count; i += 1) {
    reshuffleIfNeeded(deck, discard, rng);
    if (deck.length === 0) break;
    const card = deck.pop();
    hand.push(card);
    drawn.push(card);
  }
  return drawn;
}
