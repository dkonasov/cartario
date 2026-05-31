import type { Card } from "@domain/models/card";
import type { Deck } from "@domain/models/deck";

// Minimal runtime-parse helpers for scaffold.
export function decodeDeck(json: string): Deck {
  return JSON.parse(json) as Deck;
}

export function encodeDeck(deck: Deck): string {
  return JSON.stringify(deck);
}

export function decodeCard(json: string): Card {
  return JSON.parse(json) as Card;
}

export function encodeCard(card: Card): string {
  return JSON.stringify(card);
}
