export interface StoreOptions {
  idField?: string;
}

export interface Store<T, TId = string> {
  create(item: Partial<T>): T;
  get(id: TId): Promise<T | undefined>;
  list(): Promise<T[]>;
  update(id: TId, updates: Partial<T>): Promise<T | undefined>;
  delete(id: TId): Promise<boolean>;
}