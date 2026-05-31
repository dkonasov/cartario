import type { DeckRepository } from "@domain/repositories/deck-repository";
import type { Deck } from "@domain/models/deck";
import type { StorageDriver } from "@infrastructure/storage/storage-driver";
import { decodeDeck, encodeDeck } from "@infrastructure/storage/codec";

const INDEX_KEY = "cartario:deck:index";

export class LocalDeckRepository implements DeckRepository {
  constructor(private readonly driver: StorageDriver) {}

  private key(id: string) {
    return `cartario:deck:${id}`;
  }

  async getAll(): Promise<Deck[]> {
    const ids = await this.getIndex();
    const out: Deck[] = [];
    for (const id of ids) {
      const json = await this.driver.get(this.key(id));
      if (json) out.push(decodeDeck(json));
    }
    return out;
  }

  async getById(id: string): Promise<Deck | null> {
    const json = await this.driver.get(this.key(id));
    return json ? decodeDeck(json) : null;
  }

  async save(deck: Deck): Promise<void> {
    await this.driver.set(this.key(deck.id), encodeDeck(deck));
    const index = await this.getIndex();
    if (!index.includes(deck.id)) {
      index.push(deck.id);
      await this.driver.set(INDEX_KEY, JSON.stringify(index));
    }
  }

  async delete(id: string): Promise<void> {
    await this.driver.remove(this.key(id));
    const index = await this.getIndex();
    const next = index.filter((x) => x !== id);
    await this.driver.set(INDEX_KEY, JSON.stringify(next));
  }

  private async getIndex(): Promise<string[]> {
    const json = await this.driver.get(INDEX_KEY);
    if (!json) return [];
    try {
      const parsed = JSON.parse(json) as unknown;
      return Array.isArray(parsed) ? (parsed.filter((x) => typeof x === "string") as string[]) : [];
    } catch {
      return [];
    }
  }
}
