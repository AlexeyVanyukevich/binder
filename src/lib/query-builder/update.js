const { buildWhere } = require("./where");

/**
 * @typedef {import('.').Query} Query
 * @typedef {import('.').UpdateBuilder} UpdateBuilder
 */

/**
 * @param {string} table
 * @returns {UpdateBuilder}
 */
const update = (table) => {
  const updates = {};
  let whereClause;

  const builder = {
    set(key, value) {
      updates[key] = value;
      return builder;
    },

    where(condition) {
      whereClause = condition;
      return builder;
    },

    build() {
      const keys = Object.keys(updates);
      const values = Object.values(updates);
      const setClauses = keys.map((k) => `${k} = ?`).join(", ");
      const parts = [`UPDATE ${table} SET ${setClauses}`];
      const params = [...values];

      if (whereClause) {
        const w = buildWhere(whereClause);
        parts.push(w.sql);
        params.push(...w.params);
      }

      return { sql: parts.filter(Boolean).join(" "), params };
    },
  };

  return builder;
};

module.exports = { update };
