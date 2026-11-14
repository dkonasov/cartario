export class Cacheable<T, A extends unknown[]> {
  private cached: T | null = null;

  constructor(private retriever: (...args: A) => Promise<T>) {}

  async get(...args: A): Promise<T> {
    if (!this.cached) {
      this.cached = await this.retriever(...args);
    }

    return this.cached;
  }
}
