import { describe, expect, it } from "vitest";
import { DeckService } from "@application/deck-service";
import { LocalDeckRepository } from "@infrastructure/repositories/local-deck-repository";
import { MemoryStorageDriver } from "@infrastructure/storage/memory-storage-driver";

describe("DeckService", () => {
  describe("create", () => {
    it("creates a new deck with name and description", async () => {
      // Arrange
      const storage = new MemoryStorageDriver();
      const repository = new LocalDeckRepository(storage);
      const service = new DeckService(repository, {} as any);
      const now = Date.now();

      // Act
      const deck = await service.create({
        name: "My First Deck",
        description: "A test deck for learning",
        now,
      });

      // Assert
      expect(deck).toBeDefined();
      expect(deck.id).toBeDefined();
      expect(deck.name).toBe("My First Deck");
      expect(deck.description).toBe("A test deck for learning");
      expect(deck.createdAt).toBe(now);
      expect(deck.updatedAt).toBe(now);
    });

    it("persists the deck via the repository", async () => {
      // Arrange
      const storage = new MemoryStorageDriver();
      const repository = new LocalDeckRepository(storage);
      const service = new DeckService(repository, {} as any);
      const now = Date.now();

      // Act
      const created = await service.create({
        name: "Persistent Deck",
        description: "This should be persisted",
        now,
      });

      // Assert - verify it was saved by retrieving it
      const retrieved = await repository.getById(created.id);
      expect(retrieved).toBeDefined();
      expect(retrieved?.name).toBe("Persistent Deck");
      expect(retrieved?.description).toBe("This should be persisted");
      expect(retrieved?.id).toBe(created.id);
    });

    it("creates multiple decks with unique IDs", async () => {
      // Arrange
      const storage = new MemoryStorageDriver();
      const repository = new LocalDeckRepository(storage);
      const service = new DeckService(repository, {} as any);
      const now = Date.now();

      // Act
      const deck1 = await service.create({
        name: "Deck 1",
        description: "First deck",
        now,
      });

      const deck2 = await service.create({
        name: "Deck 2",
        description: "Second deck",
        now,
      });

      // Assert
      expect(deck1.id).not.toBe(deck2.id);
      expect(deck1.name).toBe("Deck 1");
      expect(deck2.name).toBe("Deck 2");

      // Both should be retrievable
      const retrieved1 = await repository.getById(deck1.id);
      const retrieved2 = await repository.getById(deck2.id);
      expect(retrieved1?.name).toBe("Deck 1");
      expect(retrieved2?.name).toBe("Deck 2");
    });
  });
});
