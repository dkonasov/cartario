import type { Card } from "@domain/models/card";
import type { Grade } from "@domain/models/review";

export interface SchedulingPolicy {
  schedule(
    card: Card,
    grade: Grade,
    now: number,
  ): Pick<Card, "due" | "interval" | "easeFactor" | "repetitions" | "lapses">;
}
