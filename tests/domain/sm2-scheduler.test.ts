import { describe, expect, it } from "vitest";
import { Sm2Scheduler } from "@domain/scheduling/sm2-scheduler";

describe("Sm2Scheduler", () => {
  it("schedules due in the future for successful grades", () => {
    const scheduler = new Sm2Scheduler();
    const now = 1_700_000_000_000;

    const card = {
      id: "c1",
      deckId: "d1",
      front: "a",
      back: "b",
      createdAt: now,
      updatedAt: now,
      due: now,
      interval: 1,
      easeFactor: 2.5,
      repetitions: 0,
      lapses: 0,
    };

    const next = scheduler.schedule(card, "good", now);
    expect(next.due).toBeGreaterThan(now);
    expect(next.interval).toBeGreaterThanOrEqual(1);
  });
});
