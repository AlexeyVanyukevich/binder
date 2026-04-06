import type { Config } from "../config";

export interface QueryResult<T> {
  rows: T[];
  rowCount: number | null;
}

export interface PgClient {
  query<T = unknown>(sql: string, params?: unknown[]): Promise<QueryResult<T>>;
  connect(): Promise<import("pg").PoolClient>;
  end(): Promise<void>;
}

export declare function pg(config: Config): PgClient;
