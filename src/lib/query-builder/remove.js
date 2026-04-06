const { buildWhere } = require("./where");

/**
 * @typedef {import('.').Query} Query
 * @typedef {import('.').RemoveBuilder} RemoveBuilder
 */

/**
 * @param {string} table
 * @returns {RemoveBuilder}
 */
const remove = (table) => {
  let whereClause;

  const builder = {
    where(condition) {
      whereClause = condition;
      return builder;
    },

    build() {
      const parts = [`DELETE FROM ${table}`];
      const params = [];

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

module.exports = { remove };
