export interface Ok<T> {
  readonly ok: true;
  readonly value: T;
  map<U>(fn: (value: T) => U): Ok<U>;
  flatMap<U>(fn: (value: T) => Result<U>): Result<U>;
  unwrap(): T;
  unwrapOr(fallback: T): T;
  match<U>(cases: { ok: (value: T) => U; err: (error: Error) => U }): U;
}

export interface Err {
  readonly ok: false;
  readonly error: Error;
  map<U>(fn: (value: never) => U): Err;
  flatMap<U>(fn: (value: never) => Result<U>): Err;
  unwrap(): never;
  unwrapOr<T>(fallback: T): T;
  match<U>(cases: { ok: (value: never) => U; err: (error: Error) => U }): U;
}

export type Result<T = unknown> = Ok<T> | Err;

export declare function ok<T>(value: T): Ok<T>;
export declare function err(error: string | Error): Err;
export declare function from<T>(fn: () => T): Result<T>;
export declare function fromAsync<T>(fn: () => Promise<T>): Promise<Result<T>>;
