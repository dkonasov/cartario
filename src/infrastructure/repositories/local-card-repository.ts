import type { CardRepository } from "@domain/repositories/card-repository";
import type { Card } from "@domain/models/card";
import type { StorageDriver } from "@infrastructure/storage/storage-driver";
import { decodeCard, encodeCard } from "@infrastructure/storage/codec";

export class LocalCardRepository implements CardRepository {
  constructor(private readonly driver: StorageDriver) {}

  private key(id: string) {
    return `cartario:card:${id}`;
  }

  private indexKey(deckId: string) {
    return `cartario:card:byDeck:${deckId}`;
  }

  async getByDeck(deckId: string): Promise<Card[]> {
    const ids = await this.getDeckIndex(deckId);
    const out: Card[] = [];
    for (const id of ids) {
      const json = await this.driver.get(this.key(id));
      if (json) out.push(decodeCard(json));
    }
    return out;
  }

  async getById(id: string): Promise<Card | null> {
    const json = await this.driver.get(this.key(id));
    return json ? decodeCard(json) : null;
  }

  async getDue(deckId: string, now: number): Promise<Card[]> {
    const all = await this.getByDeck(deckId);
    return all.filter((c) => c.due <= now);
  }

  async save(card: Card): Promise<void> {
    await this.driver.set(this.key(card.id), encodeCard(card));
    const indexKey = this.indexKey(card.deckId);
    const ids = await this.getDeckIndex(card.deckId);
    if (!ids.includes(card.id)) {
      ids.push(card.id);
      await this.driver.set(indexKey, JSON.stringify(ids));
    }
  }

  async deleteByDeck(deckId: string): Promise<void> {
    const ids = await this.getDeckIndex(deckId);
    for (const id of ids) {
      await this.driver.remove(this.key(id));
    }
    await this.driver.remove(this.indexKey(deckId));
  }

  async delete(id: string): Promise<void> {
    const card = await this.getById(id);
    if (!card) return;
    await this.driver.remove(this.key(id));
    const ids = await this.getDeckIndex(card.deckId);
    await this.driver.set(this.indexKey(card.deckId), JSON.stringify(ids.filter((x) => x !== id)));
  }

  private async getDeckIndex(deckId: string): Promise<string[]> {
    const json = await this.driver.get(this.indexKey(deckId));
    if (!json) return [];
    try {
      const parsed = JSON.parse(json) as unknown;
      return Array.isArray(parsed) ? (parsed.filter((x) => typeof x === "string") as string[]) : [];
    } catch {
      return [];
    }
  }
}
