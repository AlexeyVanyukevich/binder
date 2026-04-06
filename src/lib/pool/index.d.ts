export interface Pool<T> {
  add(key: string, item: T): void;
  remove(key: string, item: T): void;
  get(key: string): Set<T>;
  has(key: string): boolean;
  clear(key: string): void;
  size(key: string): number;
}

export declare function pool<T>(): Pool<T>;
