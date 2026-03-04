// ---------- Data Access ----------

export interface DataAccess<T> {
  get(id: string): T | undefined;
  getAll(): T[];
  set(id: string, item: T): void;
  delete(id: string): boolean;
}

// ---------- Store ----------

export interface Store<T> {
  create(id: string, item: T): T;
  get(id: string): T | undefined;
  list(): T[];
  update(id: string, updates: Partial<T>): T | undefined;
  delete(id: string): boolean;
}

export declare function store<T>(dataAccess: DataAccess<T>): Store<T>;
