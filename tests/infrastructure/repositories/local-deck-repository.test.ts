import { describe, expect, it, beforeEach } from "vitest";
import { LocalDeckRepository } from "@infrastructure/repositories/local-deck-repository";
import { MemoryStorageDriver } from "@infrastructure/storage/memory-storage-driver";
import type { Deck } from "@domain/models/deck";

describe("LocalDeckRepository", () => {
  let repository: LocalDeckRepository;
  let storage: MemoryStorageDriver;

  beforeEach(() => {
    storage = new MemoryStorageDriver();
    repository = new LocalDeckRepository(storage);
  });

  describe("save and getById", () => {
    it("saves a deck and retrieves it by ID", async () => {
      // Arrange
      const now = Date.now();
      const deck: Deck = {
        id: "deck-1",
        name: "Test Deck",
        description: "A test deck",
        createdAt: now,
        updatedAt: now,
      };

      // Act
      await repository.save(deck);
      const retrieved = await repository.getById("deck-1");

      // Assert
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe("deck-1");
      expect(retrieved?.name).toBe("Test Deck");
      expect(retrieved?.description).toBe("A test deck");
      expect(retrieved?.createdAt).toBe(now);
      expect(retrieved?.updatedAt).toBe(now);
    });

    it("returns null for non-existent deck", async () => {
      // Act
      const result = await repository.getById("non-existent-id");

      // Assert
      expect(result).toBeNull();
    });

    it("updates an existing deck", async () => {
      // Arrange
      const now = Date.now();
      const original: Deck = {
        id: "deck-2",
        name: "Original Name",
        description: "Original Description",
        createdAt: now,
        updatedAt: now,
      };

      await repository.save(original);

      const updated: Deck = {
        id: "deck-2",
        name: "Updated Name",
        description: "Updated Description",
        createdAt: now,
        updatedAt: now + 1000,
      };

      // Act
      await repository.save(updated);
      const retrieved = await repository.getById("deck-2");

      // Assert
      expect(retrieved?.name).toBe("Updated Name");
      expect(retrieved?.description).toBe("Updated Description");
      expect(retrieved?.updatedAt).toBe(now + 1000);
    });
  });

  describe("getAll", () => {
    it("returns empty array when no decks exist", async () => {
      // Act
      const result = await repository.getAll();

      // Assert
      expect(result).toEqual([]);
    });

    it("returns all saved decks", async () => {
      // Arrange
      const now = Date.now();
      const deck1: Deck = {
        id: "deck-1",
        name: "Deck 1",
        description: "First deck",
        createdAt: now,
        updatedAt: now,
      };

      const deck2: Deck = {
        id: "deck-2",
        name: "Deck 2",
        description: "Second deck",
        createdAt: now + 1000,
        updatedAt: now + 1000,
      };

      await repository.save(deck1);
      await repository.save(deck2);

      // Act
      const result = await repository.getAll();

      // Assert
      expect(result).toHaveLength(2);
      expect(result.map((d) => d.id)).toContain("deck-1");
      expect(result.map((d) => d.id)).toContain("deck-2");
    });

    it("returns all decks even after updates", async () => {
      // Arrange
      const now = Date.now();
      const deck1: Deck = {
        id: "deck-1",
        name: "Deck 1",
        description: "First deck",
        createdAt: now,
        updatedAt: now,
      };

      await repository.save(deck1);

      const updated: Deck = {
        ...deck1,
        name: "Updated Deck 1",
        updatedAt: now + 1000,
      };

      // Act
      await repository.save(updated);
      const result = await repository.getAll();

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]?.name).toBe("Updated Deck 1");
    });
  });

  describe("delete", () => {
    it("deletes a deck by ID", async () => {
      // Arrange
      const now = Date.now();
      const deck: Deck = {
        id: "deck-1",
        name: "Test Deck",
        description: "A test deck",
        createdAt: now,
        updatedAt: now,
      };

      await repository.save(deck);

      // Act
      await repository.delete("deck-1");
      const retrieved = await repository.getById("deck-1");

      // Assert
      expect(retrieved).toBeNull();
    });

    it("removes deck from getAll after deletion", async () => {
      // Arrange
      const now = Date.now();
      const deck1: Deck = {
        id: "deck-1",
        name: "Deck 1",
        description: "First deck",
        createdAt: now,
        updatedAt: now,
      };

      const deck2: Deck = {
        id: "deck-2",
        name: "Deck 2",
        description: "Second deck",
        createdAt: now,
        updatedAt: now,
      };

      await repository.save(deck1);
      await repository.save(deck2);

      // Act
      await repository.delete("deck-1");
      const result = await repository.getAll();

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]?.id).toBe("deck-2");
    });

    it("handles deletion of non-existent deck gracefully", async () => {
      // Act & Assert - should not throw
      await expect(repository.delete("non-existent-id")).resolves.toBeUndefined();
    });
  });

  describe("storage persistence", () => {
    it("stores decks using cartario:deck:* key scheme", async () => {
      // Arrange
      const now = Date.now();
      const deck: Deck = {
        id: "test-deck-123",
        name: "Keyed Deck",
        description: "Check the storage key",
        createdAt: now,
        updatedAt: now,
      };

      // Act
      await repository.save(deck);

      // Assert - verify the storage driver has the expected key
      const stored = await storage.get("cartario:deck:test-deck-123");
      expect(stored).toBeDefined();
      const parsed = JSON.parse(stored!);
      expect(parsed.name).toBe("Keyed Deck");
    });

    it("maintains an index of deck IDs", async () => {
      // Arrange
      const now = Date.now();
      const deck1: Deck = {
        id: "deck-1",
        name: "Deck 1",
        description: "First",
        createdAt: now,
        updatedAt: now,
      };

      const deck2: Deck = {
        id: "deck-2",
        name: "Deck 2",
        description: "Second",
        createdAt: now,
        updatedAt: now,
      };

      // Act
      await repository.save(deck1);
      await repository.save(deck2);

      // Assert - verify the index was maintained
      const indexJson = await storage.get("cartario:deck:index");
      expect(indexJson).toBeDefined();
      const index = JSON.parse(indexJson!);
      expect(index).toContain("deck-1");
      expect(index).toContain("deck-2");
    });

    it("removes deck from index on deletion", async () => {
      // Arrange
      const now = Date.now();
      const deck: Deck = {
        id: "deck-1",
        name: "Deck 1",
        description: "Test",
        createdAt: now,
        updatedAt: now,
      };

      await repository.save(deck);

      // Act
      await repository.delete("deck-1");

      // Assert
      const indexJson = await storage.get("cartario:deck:index");
      if (indexJson) {
        const index = JSON.parse(indexJson);
        expect(index).not.toContain("deck-1");
      }
    });
  });
});
