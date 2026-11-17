export type JsonRecord<T> = { value: T; etag: string };
export interface JsonStore {
  get<T>(key: string): Promise<JsonRecord<T> | null>;
  // null means create only; a string means replace that exact version.
  put<T>(key: string, value: T, etag: string | null): Promise<void>;
  remove(key: string, etag: string): Promise<void>;
}
export class JsonConflictError extends Error {}

// Local Deno authentication retains its original process-scoped behavior.
// Hosted authentication always uses the durable adapter instead.
export class MemoryJsonStore implements JsonStore {
  private records = new Map<string, JsonRecord<unknown>>();
  private revision = 0;
  async get<T>(key: string): Promise<JsonRecord<T> | null> {
    return structuredClone(this.records.get(key) as JsonRecord<T> | undefined) ?? null;
  }
  async put<T>(key: string, value: T, etag: string | null): Promise<void> {
    if ((this.records.get(key)?.etag ?? null) !== etag) throw new JsonConflictError();
    this.records.set(key, { value: structuredClone(value), etag: String(++this.revision) });
  }
  async remove(key: string, etag: string): Promise<void> {
    if (this.records.get(key)?.etag !== etag) throw new JsonConflictError();
    this.records.delete(key);
  }
}
