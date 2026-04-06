/**
 * @typedef {import('.').Query} Query
 * @typedef {import('.').InsertBuilder} InsertBuilder
 */

/**
 * @param {string} table
 * @returns {InsertBuilder}
 */
const insert = (table) => {
  const record = {};

  const builder = {
    set(key, value) {
      record[key] = value;
      return builder;
    },

    build() {
      const keys = Object.keys(record);
      const values = Object.values(record);
      const columns = keys.join(", ");
      const placeholders = keys.map(() => "?").join(", ");
      return {
        sql: `INSERT INTO ${table} (${columns}) VALUES (${placeholders})`,
        params: values,
      };
    },
  };

  return builder;
};

module.exports = { insert };
