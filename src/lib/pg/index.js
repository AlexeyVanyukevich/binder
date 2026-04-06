const { Pool } = require("pg");

/**
 * @typedef {import('.').PgClient} PgClient
 * @typedef {import('../config').Config} Config
 */

/**
 * Creates a PostgreSQL client backed by a connection pool.
 * Config keys (from env vars DATABASE__*): database.host, database.port,
 * database.name, database.user, database.password, database.max_connections
 * @param {Config} config
 * @returns {PgClient}
 */
const pg = (config) => {
  const pool = new Pool({
    host: config.getRequired("database.host"),
    port: Number(config.getOrDefault("database.port", 5432)),
    database: config.getRequired("database.name"),
    user: config.getRequired("database.user"),
    password: config.getRequired("database.password"),
    max: Number(config.getOrDefault("database.max_connections", 10)),
  });

  pool.on("error", (err) => {
    console.error("Unexpected PG pool error:", err);
  });

  /**
   * @param {string} sql
   * @param {unknown[]} [params]
   * @returns {Promise<import('.').QueryResult<unknown>>}
   */
  const query = (sql, params) => pool.query(sql, params);

  /**
   * Acquires a raw pool client (caller must call client.release()).
   * @returns {Promise<import('pg').PoolClient>}
   */
  const connect = () => pool.connect();

  /** @returns {Promise<void>} */
  const end = () => pool.end();

  return { query, connect, end };
};

module.exports = { pg };
