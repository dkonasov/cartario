import type { Card } from "@domain/models/card";
import type { Grade } from "@domain/models/review";
import type { SchedulingPolicy } from "@domain/scheduling/scheduler";

// MVP SM-2 style scheduler.
export class Sm2Scheduler implements SchedulingPolicy {
  schedule(card: Card, grade: Grade, now: number) {
    let { easeFactor, interval, repetitions, lapses } = card;

    // Tuning values are intentionally conservative for the scaffold.
    switch (grade) {
      case "again":
        lapses += 1;
        repetitions = 0;
        interval = 1;
        break;
      case "hard":
        repetitions += 1;
        interval = Math.max(1, Math.round(interval * 1.2));
        break;
      case "good":
        repetitions += 1;
        interval = Math.max(1, Math.round(interval * easeFactor));
        break;
      case "easy":
        repetitions += 1;
        interval = Math.max(1, Math.round(interval * (easeFactor * 1.3)));
        break;
      default: {
        const _exhaustive: never = grade;
        throw new Error(`Unhandled grade: ${_exhaustive}`);
      }
    }

    // Adjust ease factor.
    const delta = grade === "again" ? -0.2 : grade === "hard" ? -0.05 : grade === "easy" ? 0.15 : 0;
    easeFactor = Math.max(1.3, easeFactor + delta);

    const due = now + interval * 24 * 60 * 60 * 1000;
    return { due, interval, easeFactor, repetitions, lapses };
  }
}
