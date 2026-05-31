import type { Card } from "@domain/models/card";
import type { Grade } from "@domain/models/review";
import type { CardRepository } from "@domain/repositories/card-repository";
import type { SchedulingPolicy } from "@domain/scheduling/scheduler";
import type { Clock } from "@shared/clock";

export interface SessionOptions {
  limit?: number;
  shuffle?: boolean;
}

export class StudyService {
  constructor(
    private readonly cards: CardRepository,
    private readonly scheduler: SchedulingPolicy,
    private readonly clock: Clock,
  ) {}

  async buildSession(deckId: string, options?: SessionOptions): Promise<Card[]> {
    const { limit, shuffle = true } = options ?? {};
    const now = this.clock.now();
    const due = await this.cards.getDue(deckId, now);

    let result = due;

    // Shuffle if requested (default true)
    if (shuffle) {
      result = [...due]; // Create a copy to avoid mutating the original
      for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const a = result[i];
        const b = result[j];
        // noUncheckedIndexedAccess => indexes can be undefined; indices are in-bounds here.
        result[i] = b!;
        result[j] = a!;
      }
    }

    // Cap to limit if provided
    if (limit !== undefined) {
      result = result.slice(0, limit);
    }

    return result;
  }

  async countDue(deckId: string): Promise<number> {
    const now = this.clock.now();
    const due = await this.cards.getDue(deckId, now);
    return due.length;
  }

  async grade(card: Card, grade: Grade): Promise<Card> {
    const now = this.clock.now();
    const sr = this.scheduler.schedule(card, grade, now);
    const updated: Card = { ...card, ...sr, updatedAt: now };
    await this.cards.save(updated);
    return updated;
  }
}
