import type { CardRepository } from "@domain/repositories/card-repository";
import type { Card } from "@domain/models/card";
import { newId } from "@shared/id";

export class CardService {
  constructor(private readonly cards: CardRepository) {}

  async listByDeck(deckId: string): Promise<Card[]> {
    return this.cards.getByDeck(deckId);
  }

  async create(input: { deckId: string; front: string; back: string; now: number }): Promise<Card> {
    const now = input.now;
    const card: Card = {
      id: newId(),
      deckId: input.deckId,
      front: input.front,
      back: input.back,
      createdAt: now,
      updatedAt: now,
      due: now,
      interval: 1,
      easeFactor: 2.5,
      repetitions: 0,
      lapses: 0,
    };
    await this.cards.save(card);
    return card;
  }

  async update(
    id: string,
    input: { front: string; back: string; now: number; due?: number },
  ): Promise<Card> {
    const existing = await this.cards.getById(id);
    if (!existing) throw new Error("Card not found");
    const next: Card = {
      ...existing,
      front: input.front,
      back: input.back,
      updatedAt: input.now,
    };
    if (input.due !== undefined) {
      next.due = input.due;
    }
    await this.cards.save(next);
    return next;
  }

  async delete(id: string): Promise<void> {
    await this.cards.delete(id);
  }
}
