import type { StorageDriver } from "@infrastructure/storage/storage-driver";

export class LocalStorageDriver implements StorageDriver {
  constructor(private readonly storage: Storage) {}

  async get(key: string): Promise<string | null> {
    return this.storage.getItem(key);
  }

  async set(key: string, value: string): Promise<void> {
    this.storage.setItem(key, value);
  }

  async remove(key: string): Promise<void> {
    this.storage.removeItem(key);
  }

  async keys(): Promise<string[]> {
    const out: string[] = [];
    for (let i = 0; i < this.storage.length; i++) {
      const k = this.storage.key(i);
      if (k) out.push(k);
    }
    return out;
  }
}
