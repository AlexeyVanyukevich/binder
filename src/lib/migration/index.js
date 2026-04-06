const fs = require("node:fs");
const path = require("node:path");

/**
 * @typedef {import('.').MigrationRunner} MigrationRunner
 * @typedef {import('../pg').PgClient} PgClient
 */

const CREATE_MIGRATIONS_TABLE = `
  CREATE TABLE IF NOT EXISTS migrations (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(255) NOT NULL UNIQUE,
    applied_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
  )
`;

/**
 * Creates a migration runner.
 * @param {PgClient} db
 * @param {string} migrationsDir - Absolute path to migrations directory.
 * @returns {MigrationRunner}
 */
const migration = (db, migrationsDir) => {
  const ensureTable = () => db.query(CREATE_MIGRATIONS_TABLE);

  /** @returns {Promise<string[]>} Applied migration names */
  const appliedMigrations = async () => {
    const result = await db.query("SELECT name FROM migrations ORDER BY id");
    return result.rows.map((r) => r.name);
  };

  /** @returns {string[]} Sorted migration file names */
  const migrationFiles = () => {
    if (!fs.existsSync(migrationsDir)) return [];
    return fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith(".js"))
      .sort();
  };

  const up = async () => {
    await ensureTable();
    const applied = await appliedMigrations();
    const files = migrationFiles();
    const pending = files.filter((f) => !applied.includes(f));

    if (pending.length === 0) {
      console.log("No pending migrations.");
      return;
    }

    for (const file of pending) {
      const client = await db.connect();
      try {
        await client.query("BEGIN");
        const { up: runUp } = require(path.join(migrationsDir, file));
        await runUp(client);
        await client.query(
          "INSERT INTO migrations (name) VALUES ($1)",
          [file]
        );
        await client.query("COMMIT");
        console.log(`Applied: ${file}`);
      } catch (err) {
        await client.query("ROLLBACK");
        throw new Error(`Migration ${file} failed: ${err.message}`);
      } finally {
        client.release();
      }
    }
  };

  /**
   * @param {number} [steps=1]
   */
  const down = async (steps = 1) => {
    await ensureTable();
    const applied = await appliedMigrations();
    const toRollback = applied.slice(-steps).reverse();

    if (toRollback.length === 0) {
      console.log("Nothing to roll back.");
      return;
    }

    for (const file of toRollback) {
      const client = await db.connect();
      try {
        await client.query("BEGIN");
        const { down: runDown } = require(path.join(migrationsDir, file));
        await runDown(client);
        await client.query("DELETE FROM migrations WHERE name = $1", [file]);
        await client.query("COMMIT");
        console.log(`Rolled back: ${file}`);
      } catch (err) {
        await client.query("ROLLBACK");
        throw new Error(`Rollback of ${file} failed: ${err.message}`);
      } finally {
        client.release();
      }
    }
  };

  return { up, down };
};

module.exports = { migration };
