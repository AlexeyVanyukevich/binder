/**
 * @typedef {import('.').Query} Query
 * @typedef {import('.').DropTableBuilder} DropTableBuilder
 */

/**
 * @param {string} table
 * @returns {DropTableBuilder}
 */
const dropTable = (table) => {
  let exists = false;

  const builder = {
    ifExists() {
      exists = true;
      return builder;
    },

    build() {
      const prefix = exists ? "IF EXISTS " : "";
      return { sql: `DROP TABLE ${prefix}${table}` };
    },
  };

  return builder;
};

module.exports = { dropTable };
