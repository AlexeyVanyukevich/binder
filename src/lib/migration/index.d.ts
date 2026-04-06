import type { PgClient } from "../pg";

export interface MigrationRunner {
  up(): Promise<void>;
  down(steps?: number): Promise<void>;
}

export declare function migration(
  db: PgClient,
  migrationsDir: string
): MigrationRunner;
