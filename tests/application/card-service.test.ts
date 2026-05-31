import { describe, expect, it } from "vitest";
import { CardService } from "@application/card-service";
import { LocalCardRepository } from "@infrastructure/repositories/local-card-repository";
import { MemoryStorageDriver } from "@infrastructure/storage/memory-storage-driver";

describe("CardService", () => {
  describe("create", () => {
    it("creates a new card with front and back text", async () => {
      // Arrange
      const storage = new MemoryStorageDriver();
      const repository = new LocalCardRepository(storage);
      const service = new CardService(repository);
      const now = Date.now();
      const deckId = "test-deck-1";

      // Act
      const card = await service.create({
        deckId,
        front: "What is the capital of France?",
        back: "Paris",
        now,
      });

      // Assert
      expect(card).toBeDefined();
      expect(card.id).toBeDefined();
      expect(card.deckId).toBe(deckId);
      expect(card.front).toBe("What is the capital of France?");
      expect(card.back).toBe("Paris");
      expect(card.createdAt).toBe(now);
      expect(card.updatedAt).toBe(now);
    });

    it("initializes spaced repetition fields with default SM2 values", async () => {
      // Arrange
      const storage = new MemoryStorageDriver();
      const repository = new LocalCardRepository(storage);
      const service = new CardService(repository);
      const now = Date.now();

      // Act
      const card = await service.create({
        deckId: "test-deck-1",
        front: "Question?",
        back: "Answer",
        now,
      });

      // Assert
      expect(card.due).toBe(now);
      expect(card.interval).toBe(1);
      expect(card.easeFactor).toBe(2.5);
      expect(card.repetitions).toBe(0);
      expect(card.lapses).toBe(0);
    });

    it("persists the card via the repository", async () => {
      // Arrange
      const storage = new MemoryStorageDriver();
      const repository = new LocalCardRepository(storage);
      const service = new CardService(repository);
      const now = Date.now();
      const deckId = "test-deck-1";

      // Act
      const created = await service.create({
        deckId,
        front: "Test front",
        back: "Test back",
        now,
      });

      // Assert - verify it was saved by retrieving it
      const retrieved = await repository.getById(created.id);
      expect(retrieved).toBeDefined();
      expect(retrieved?.front).toBe("Test front");
      expect(retrieved?.back).toBe("Test back");
      expect(retrieved?.deckId).toBe(deckId);
      expect(retrieved?.id).toBe(created.id);
    });

    it("creates multiple cards with unique IDs", async () => {
      // Arrange
      const storage = new MemoryStorageDriver();
      const repository = new LocalCardRepository(storage);
      const service = new CardService(repository);
      const now = Date.now();
      const deckId = "test-deck-1";

      // Act
      const card1 = await service.create({
        deckId,
        front: "Q1?",
        back: "A1",
        now,
      });

      const card2 = await service.create({
        deckId,
        front: "Q2?",
        back: "A2",
        now,
      });

      // Assert
      expect(card1.id).not.toBe(card2.id);
      expect(card1.front).toBe("Q1?");
      expect(card2.front).toBe("Q2?");

      // Both should be retrievable
      const retrieved1 = await repository.getById(card1.id);
      const retrieved2 = await repository.getById(card2.id);
      expect(retrieved1?.front).toBe("Q1?");
      expect(retrieved2?.front).toBe("Q2?");
    });
  });

  describe("update", () => {
    it("updates card front and back text", async () => {
      // Arrange
      const storage = new MemoryStorageDriver();
      const repository = new LocalCardRepository(storage);
      const service = new CardService(repository);
      const now = Date.now();
      const created = await service.create({
        deckId: "test-deck-1",
        front: "Original front",
        back: "Original back",
        now,
      });

      // Act
      const updated = await service.update(created.id, {
        front: "Updated front",
        back: "Updated back",
        now: now + 1000,
      });

      // Assert
      expect(updated.id).toBe(created.id);
      expect(updated.front).toBe("Updated front");
      expect(updated.back).toBe("Updated back");
      expect(updated.updatedAt).toBe(now + 1000);
      // Other fields should remain unchanged
      expect(updated.createdAt).toBe(now);
      expect(updated.deckId).toBe("test-deck-1");
      expect(updated.due).toBe(now);
      expect(updated.interval).toBe(1);
      expect(updated.easeFactor).toBe(2.5);
    });

    it("throws error when card not found", async () => {
      // Arrange
      const storage = new MemoryStorageDriver();
      const repository = new LocalCardRepository(storage);
      const service = new CardService(repository);
      const now = Date.now();

      // Act & Assert
      await expect(
        service.update("non-existent-id", {
          front: "Front",
          back: "Back",
          now,
        }),
      ).rejects.toThrow("Card not found");
    });

    it("persists the updated card", async () => {
      // Arrange
      const storage = new MemoryStorageDriver();
      const repository = new LocalCardRepository(storage);
      const service = new CardService(repository);
      const now = Date.now();
      const created = await service.create({
        deckId: "test-deck-1",
        front: "Original",
        back: "Original",
        now,
      });

      // Act
      await service.update(created.id, {
        front: "Changed",
        back: "Changed",
        now: now + 1000,
      });

      // Assert - verify persistence by retrieving
      const retrieved = await repository.getById(created.id);
      expect(retrieved?.front).toBe("Changed");
      expect(retrieved?.back).toBe("Changed");
      expect(retrieved?.updatedAt).toBe(now + 1000);
    });
  });

  describe("delete", () => {
    it("removes card from repository", async () => {
      // Arrange
      const storage = new MemoryStorageDriver();
      const repository = new LocalCardRepository(storage);
      const service = new CardService(repository);
      const now = Date.now();
      const created = await service.create({
        deckId: "test-deck-1",
        front: "To delete",
        back: "To delete",
        now,
      });

      // Act
      await service.delete(created.id);

      // Assert
      const retrieved = await repository.getById(created.id);
      expect(retrieved).toBeNull();
    });
  });

  describe("listByDeck", () => {
    it("returns all cards for a specific deck", async () => {
      // Arrange
      const storage = new MemoryStorageDriver();
      const repository = new LocalCardRepository(storage);
      const service = new CardService(repository);
      const now = Date.now();
      const deck1 = "deck-1";
      const deck2 = "deck-2";

      // Create cards in different decks
      const card1 = await service.create({
        deckId: deck1,
        front: "Q1",
        back: "A1",
        now,
      });

      const card2 = await service.create({
        deckId: deck1,
        front: "Q2",
        back: "A2",
        now,
      });

      const card3 = await service.create({
        deckId: deck2,
        front: "Q3",
        back: "A3",
        now,
      });

      // Act
      const deck1Cards = await service.listByDeck(deck1);
      const deck2Cards = await service.listByDeck(deck2);

      // Assert
      expect(deck1Cards).toHaveLength(2);
      expect(deck2Cards).toHaveLength(1);
      expect(deck1Cards.map((c) => c.id)).toContain(card1.id);
      expect(deck1Cards.map((c) => c.id)).toContain(card2.id);
      expect(deck2Cards[0]?.id).toBe(card3.id);
    });

    it("returns empty array for unknown deck", async () => {
      // Arrange
      const storage = new MemoryStorageDriver();
      const repository = new LocalCardRepository(storage);
      const service = new CardService(repository);

      // Act
      const cards = await service.listByDeck("unknown-deck-id");

      // Assert
      expect(cards).toEqual([]);
    });

    it("returns empty array when deck has no cards", async () => {
      // Arrange
      const storage = new MemoryStorageDriver();
      const repository = new LocalCardRepository(storage);
      const service = new CardService(repository);

      // Act
      const cards = await service.listByDeck("empty-deck");

      // Assert
      expect(cards).toEqual([]);
    });
  });
});
