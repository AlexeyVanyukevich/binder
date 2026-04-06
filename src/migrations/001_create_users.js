/**
 * @param {import('pg').PoolClient} client
 */
const up = async (client) => {
  await client.query(`
    CREATE TABLE IF NOT EXISTS users (
      id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email         VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      role          VARCHAR(20) NOT NULL DEFAULT 'client',
      created_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      updated_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    )
  `);
};

/**
 * @param {import('pg').PoolClient} client
 */
const down = async (client) => {
  await client.query("DROP TABLE IF EXISTS users");
};

module.exports = { up, down };
