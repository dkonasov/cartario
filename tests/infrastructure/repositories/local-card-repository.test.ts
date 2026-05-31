import { describe, expect, it, beforeEach } from "vitest";
import { LocalCardRepository } from "@infrastructure/repositories/local-card-repository";
import { MemoryStorageDriver } from "@infrastructure/storage/memory-storage-driver";
import type { Card } from "@domain/models/card";

describe("LocalCardRepository", () => {
  let repository: LocalCardRepository;
  let storage: MemoryStorageDriver;

  beforeEach(() => {
    storage = new MemoryStorageDriver();
    repository = new LocalCardRepository(storage);
  });

  describe("save and getById", () => {
    it("saves a card and retrieves it by ID", async () => {
      // Arrange
      const now = Date.now();
      const card: Card = {
        id: "card-1",
        deckId: "deck-1",
        front: "What is the capital of France?",
        back: "Paris",
        createdAt: now,
        updatedAt: now,
        due: now,
        interval: 1,
        easeFactor: 2.5,
        repetitions: 0,
        lapses: 0,
      };

      // Act
      await repository.save(card);
      const retrieved = await repository.getById("card-1");

      // Assert
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe("card-1");
      expect(retrieved?.deckId).toBe("deck-1");
      expect(retrieved?.front).toBe("What is the capital of France?");
      expect(retrieved?.back).toBe("Paris");
      expect(retrieved?.createdAt).toBe(now);
      expect(retrieved?.updatedAt).toBe(now);
      expect(retrieved?.interval).toBe(1);
      expect(retrieved?.easeFactor).toBe(2.5);
      expect(retrieved?.repetitions).toBe(0);
      expect(retrieved?.lapses).toBe(0);
    });

    it("returns null for non-existent card", async () => {
      // Act
      const result = await repository.getById("non-existent-id");

      // Assert
      expect(result).toBeNull();
    });

    it("updates an existing card", async () => {
      // Arrange
      const now = Date.now();
      const original: Card = {
        id: "card-2",
        deckId: "deck-1",
        front: "Original front",
        back: "Original back",
        createdAt: now,
        updatedAt: now,
        due: now,
        interval: 1,
        easeFactor: 2.5,
        repetitions: 0,
        lapses: 0,
      };

      await repository.save(original);

      const updated: Card = {
        id: "card-2",
        deckId: "deck-1",
        front: "Updated front",
        back: "Updated back",
        createdAt: now,
        updatedAt: now + 1000,
        due: now + 5000,
        interval: 3,
        easeFactor: 2.8,
        repetitions: 2,
        lapses: 0,
      };

      // Act
      await repository.save(updated);
      const retrieved = await repository.getById("card-2");

      // Assert
      expect(retrieved?.front).toBe("Updated front");
      expect(retrieved?.back).toBe("Updated back");
      expect(retrieved?.updatedAt).toBe(now + 1000);
      expect(retrieved?.interval).toBe(3);
      expect(retrieved?.easeFactor).toBe(2.8);
      expect(retrieved?.repetitions).toBe(2);
    });
  });

  describe("getByDeck", () => {
    it("returns empty array when no cards exist", async () => {
      // Act
      const result = await repository.getByDeck("deck-1");

      // Assert
      expect(result).toEqual([]);
    });

    it("returns all cards for a specific deck", async () => {
      // Arrange
      const now = Date.now();
      const card1: Card = {
        id: "card-1",
        deckId: "deck-1",
        front: "Q1",
        back: "A1",
        createdAt: now,
        updatedAt: now,
        due: now,
        interval: 1,
        easeFactor: 2.5,
        repetitions: 0,
        lapses: 0,
      };

      const card2: Card = {
        id: "card-2",
        deckId: "deck-1",
        front: "Q2",
        back: "A2",
        createdAt: now + 1000,
        updatedAt: now + 1000,
        due: now + 1000,
        interval: 1,
        easeFactor: 2.5,
        repetitions: 0,
        lapses: 0,
      };

      await repository.save(card1);
      await repository.save(card2);

      // Act
      const result = await repository.getByDeck("deck-1");

      // Assert
      expect(result).toHaveLength(2);
      expect(result.map((c) => c.id)).toContain("card-1");
      expect(result.map((c) => c.id)).toContain("card-2");
    });

    it("returns only cards for the requested deck", async () => {
      // Arrange
      const now = Date.now();
      const deck1Card: Card = {
        id: "card-1",
        deckId: "deck-1",
        front: "Q1",
        back: "A1",
        createdAt: now,
        updatedAt: now,
        due: now,
        interval: 1,
        easeFactor: 2.5,
        repetitions: 0,
        lapses: 0,
      };

      const deck2Card: Card = {
        id: "card-2",
        deckId: "deck-2",
        front: "Q2",
        back: "A2",
        createdAt: now,
        updatedAt: now,
        due: now,
        interval: 1,
        easeFactor: 2.5,
        repetitions: 0,
        lapses: 0,
      };

      await repository.save(deck1Card);
      await repository.save(deck2Card);

      // Act
      const deck1Cards = await repository.getByDeck("deck-1");
      const deck2Cards = await repository.getByDeck("deck-2");

      // Assert
      expect(deck1Cards).toHaveLength(1);
      expect(deck1Cards[0]?.id).toBe("card-1");
      expect(deck2Cards).toHaveLength(1);
      expect(deck2Cards[0]?.id).toBe("card-2");
    });

    it("returns empty array for non-existent deck", async () => {
      // Act
      const result = await repository.getByDeck("unknown-deck-id");

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe("delete", () => {
    it("deletes a card by ID", async () => {
      // Arrange
      const now = Date.now();
      const card: Card = {
        id: "card-1",
        deckId: "deck-1",
        front: "Test",
        back: "Test",
        createdAt: now,
        updatedAt: now,
        due: now,
        interval: 1,
        easeFactor: 2.5,
        repetitions: 0,
        lapses: 0,
      };

      await repository.save(card);

      // Act
      await repository.delete("card-1");
      const retrieved = await repository.getById("card-1");

      // Assert
      expect(retrieved).toBeNull();
    });

    it("removes card from getByDeck after deletion", async () => {
      // Arrange
      const now = Date.now();
      const card1: Card = {
        id: "card-1",
        deckId: "deck-1",
        front: "Q1",
        back: "A1",
        createdAt: now,
        updatedAt: now,
        due: now,
        interval: 1,
        easeFactor: 2.5,
        repetitions: 0,
        lapses: 0,
      };

      const card2: Card = {
        id: "card-2",
        deckId: "deck-1",
        front: "Q2",
        back: "A2",
        createdAt: now,
        updatedAt: now,
        due: now,
        interval: 1,
        easeFactor: 2.5,
        repetitions: 0,
        lapses: 0,
      };

      await repository.save(card1);
      await repository.save(card2);

      // Act
      await repository.delete("card-1");
      const result = await repository.getByDeck("deck-1");

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]?.id).toBe("card-2");
    });

    it("handles deletion of non-existent card gracefully", async () => {
      // Act & Assert - should not throw
      await expect(repository.delete("non-existent-id")).resolves.toBeUndefined();
    });
  });

  describe("deleteByDeck", () => {
    it("deletes all cards in a deck", async () => {
      // Arrange
      const now = Date.now();
      const card1: Card = {
        id: "card-1",
        deckId: "deck-1",
        front: "Q1",
        back: "A1",
        createdAt: now,
        updatedAt: now,
        due: now,
        interval: 1,
        easeFactor: 2.5,
        repetitions: 0,
        lapses: 0,
      };

      const card2: Card = {
        id: "card-2",
        deckId: "deck-1",
        front: "Q2",
        back: "A2",
        createdAt: now,
        updatedAt: now,
        due: now,
        interval: 1,
        easeFactor: 2.5,
        repetitions: 0,
        lapses: 0,
      };

      const card3: Card = {
        id: "card-3",
        deckId: "deck-2",
        front: "Q3",
        back: "A3",
        createdAt: now,
        updatedAt: now,
        due: now,
        interval: 1,
        easeFactor: 2.5,
        repetitions: 0,
        lapses: 0,
      };

      await repository.save(card1);
      await repository.save(card2);
      await repository.save(card3);

      // Act
      await repository.deleteByDeck("deck-1");
      const deck1Cards = await repository.getByDeck("deck-1");
      const deck2Cards = await repository.getByDeck("deck-2");

      // Assert
      expect(deck1Cards).toEqual([]);
      expect(deck2Cards).toHaveLength(1);
      expect(deck2Cards[0]?.id).toBe("card-3");
    });

    it("handles deletion of empty deck gracefully", async () => {
      // Act & Assert - should not throw
      await expect(repository.deleteByDeck("empty-deck")).resolves.toBeUndefined();
    });
  });

  describe("getDue", () => {
    it("returns cards that are due", async () => {
      // Arrange
      const now = Date.now();
      const overduCard: Card = {
        id: "card-1",
        deckId: "deck-1",
        front: "Overdue",
        back: "Answer",
        createdAt: now,
        updatedAt: now,
        due: now - 1000, // due in the past
        interval: 1,
        easeFactor: 2.5,
        repetitions: 0,
        lapses: 0,
      };

      const dueNowCard: Card = {
        id: "card-2",
        deckId: "deck-1",
        front: "Due now",
        back: "Answer",
        createdAt: now,
        updatedAt: now,
        due: now, // due right now
        interval: 1,
        easeFactor: 2.5,
        repetitions: 0,
        lapses: 0,
      };

      const futureCard: Card = {
        id: "card-3",
        deckId: "deck-1",
        front: "Future",
        back: "Answer",
        createdAt: now,
        updatedAt: now,
        due: now + 5000, // due in the future
        interval: 1,
        easeFactor: 2.5,
        repetitions: 0,
        lapses: 0,
      };

      await repository.save(overduCard);
      await repository.save(dueNowCard);
      await repository.save(futureCard);

      // Act
      const dueCards = await repository.getDue("deck-1", now);

      // Assert
      expect(dueCards).toHaveLength(2);
      expect(dueCards.map((c) => c.id)).toContain("card-1");
      expect(dueCards.map((c) => c.id)).toContain("card-2");
      expect(dueCards.map((c) => c.id)).not.toContain("card-3");
    });

    it("returns empty array when no cards are due", async () => {
      // Arrange
      const now = Date.now();
      const futureCard: Card = {
        id: "card-1",
        deckId: "deck-1",
        front: "Future",
        back: "Answer",
        createdAt: now,
        updatedAt: now,
        due: now + 5000,
        interval: 1,
        easeFactor: 2.5,
        repetitions: 0,
        lapses: 0,
      };

      await repository.save(futureCard);

      // Act
      const dueCards = await repository.getDue("deck-1", now);

      // Assert
      expect(dueCards).toEqual([]);
    });
  });

  describe("storage persistence", () => {
    it("stores cards using cartario:card:* key scheme", async () => {
      // Arrange
      const now = Date.now();
      const card: Card = {
        id: "test-card-123",
        deckId: "deck-1",
        front: "Question",
        back: "Answer",
        createdAt: now,
        updatedAt: now,
        due: now,
        interval: 1,
        easeFactor: 2.5,
        repetitions: 0,
        lapses: 0,
      };

      // Act
      await repository.save(card);

      // Assert - verify the storage driver has the expected key
      const stored = await storage.get("cartario:card:test-card-123");
      expect(stored).toBeDefined();
      const parsed = JSON.parse(stored!);
      expect(parsed.front).toBe("Question");
      expect(parsed.back).toBe("Answer");
    });

    it("maintains a per-deck index using cartario:card:byDeck:* key scheme", async () => {
      // Arrange
      const now = Date.now();
      const card1: Card = {
        id: "card-1",
        deckId: "deck-1",
        front: "Q1",
        back: "A1",
        createdAt: now,
        updatedAt: now,
        due: now,
        interval: 1,
        easeFactor: 2.5,
        repetitions: 0,
        lapses: 0,
      };

      const card2: Card = {
        id: "card-2",
        deckId: "deck-1",
        front: "Q2",
        back: "A2",
        createdAt: now,
        updatedAt: now,
        due: now,
        interval: 1,
        easeFactor: 2.5,
        repetitions: 0,
        lapses: 0,
      };

      // Act
      await repository.save(card1);
      await repository.save(card2);

      // Assert - verify the index was maintained
      const indexJson = await storage.get("cartario:card:byDeck:deck-1");
      expect(indexJson).toBeDefined();
      const index = JSON.parse(indexJson!);
      expect(index).toContain("card-1");
      expect(index).toContain("card-2");
    });

    it("removes card from index on deletion", async () => {
      // Arrange
      const now = Date.now();
      const card1: Card = {
        id: "card-1",
        deckId: "deck-1",
        front: "Q1",
        back: "A1",
        createdAt: now,
        updatedAt: now,
        due: now,
        interval: 1,
        easeFactor: 2.5,
        repetitions: 0,
        lapses: 0,
      };

      const card2: Card = {
        id: "card-2",
        deckId: "deck-1",
        front: "Q2",
        back: "A2",
        createdAt: now,
        updatedAt: now,
        due: now,
        interval: 1,
        easeFactor: 2.5,
        repetitions: 0,
        lapses: 0,
      };

      await repository.save(card1);
      await repository.save(card2);

      // Act
      await repository.delete("card-1");

      // Assert
      const indexJson = await storage.get("cartario:card:byDeck:deck-1");
      expect(indexJson).toBeDefined();
      const index = JSON.parse(indexJson!);
      expect(index).toContain("card-2");
      expect(index).not.toContain("card-1");
    });

    it("removes deck index on deleteByDeck", async () => {
      // Arrange
      const now = Date.now();
      const card: Card = {
        id: "card-1",
        deckId: "deck-1",
        front: "Q1",
        back: "A1",
        createdAt: now,
        updatedAt: now,
        due: now,
        interval: 1,
        easeFactor: 2.5,
        repetitions: 0,
        lapses: 0,
      };

      await repository.save(card);

      // Act
      await repository.deleteByDeck("deck-1");

      // Assert
      const indexJson = await storage.get("cartario:card:byDeck:deck-1");
      expect(indexJson).toBeNull();
    });
  });
});
