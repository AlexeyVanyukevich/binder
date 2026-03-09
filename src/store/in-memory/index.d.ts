import type { randomUUID } from "node:crypto";
import type { Store, StoreOptions } from "..";

export type IdType = ReturnType<typeof randomUUID>;

export interface InMemoryStore<T> extends Store<T, IdType> {}

export declare function inMemory<T>(
  options?: StoreOptions,
): InMemoryStore<T>;
