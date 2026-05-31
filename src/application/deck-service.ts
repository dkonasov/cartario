import type { CardRepository } from "@domain/repositories/card-repository";
import type { DeckRepository } from "@domain/repositories/deck-repository";
import type { Deck } from "@domain/models/deck";
import { newId } from "@shared/id";

export class DeckService {
  constructor(
    private readonly decks: DeckRepository,
    private readonly cards: CardRepository,
  ) {}

  async list(): Promise<Deck[]> {
    const decks = await this.decks.getAll();
    return decks.sort((a, b) => a.name.localeCompare(b.name));
  }

  async get(id: string): Promise<Deck | null> {
    return this.decks.getById(id);
  }

  async create(input: { name: string; description: string; now: number }): Promise<Deck> {
    const now = input.now;
    const deck: Deck = {
      id: newId(),
      name: input.name,
      description: input.description,
      createdAt: now,
      updatedAt: now,
    };
    await this.decks.save(deck);
    return deck;
  }

  async update(
    id: string,
    input: { name: string; description: string; now: number },
  ): Promise<Deck> {
    const existing = await this.decks.getById(id);
    if (!existing) throw new Error("Deck not found");
    const next: Deck = {
      ...existing,
      name: input.name,
      description: input.description,
      updatedAt: input.now,
    };
    await this.decks.save(next);
    return next;
  }

  async delete(id: string): Promise<void> {
    await this.cards.deleteByDeck(id);
    await this.decks.delete(id);
  }

  async search(query: string): Promise<Deck[]> {
    const decks = await this.list();
    const normalized = query.toLowerCase();
    return decks.filter(
      (deck) =>
        deck.name.toLowerCase().includes(normalized) ||
        deck.description.toLowerCase().includes(normalized),
    );
  }
}
