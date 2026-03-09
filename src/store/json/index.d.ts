import type { Store, StoreOptions } from "..";

export interface JsonStoreOptions extends StoreOptions {
  filePath: string;
}

export declare function json<T>(options?: JsonStoreOptions): Store<T>;
