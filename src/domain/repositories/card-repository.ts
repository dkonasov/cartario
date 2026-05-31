import type { Card } from "@domain/models/card";

export interface CardRepository {
  getByDeck(deckId: string): Promise<Card[]>;
  getById(id: string): Promise<Card | null>;
  getDue(deckId: string, now: number): Promise<Card[]>;
  save(card: Card): Promise<void>;
  deleteByDeck(deckId: string): Promise<void>;
  delete(id: string): Promise<void>;
}
