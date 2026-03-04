export interface StoreOptions {
  idField?: string;
}

export interface Store<T> {
  create(item: Partial<T>): T;
  get(id: string): Promise<T | undefined>;
  list(): Promise<T[]>;
  update(id: string, updates: Partial<T>): Promise<T | undefined>;
  delete(id: string): Promise<boolean>;
}