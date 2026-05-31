import type { Deck } from "@domain/models/deck";

export interface DeckRepository {
  getAll(): Promise<Deck[]>;
  getById(id: string): Promise<Deck | null>;
  save(deck: Deck): Promise<void>;
  delete(id: string): Promise<void>;
}
