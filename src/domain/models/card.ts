export interface Card {
  id: string;
  deckId: string;
  front: string;
  back: string;
  createdAt: number;
  updatedAt: number;

  // spaced-repetition state
  due: number;
  interval: number; // days
  easeFactor: number;
  repetitions: number;
  lapses: number;
}
