const { compile: compileColumnDef } = require("./column-definition");
const { columnDef } = require("./column-definition/builder");

/**
 * @typedef {import('.').Query} Query
 * @typedef {import('.').CreateTableBuilder} CreateTableBuilder
 */

/**
 * @param {string} table
 * @returns {CreateTableBuilder}
 */
const createTable = (table) => {
  const columnBuilders = [];
  let notExists = false;

  const currentColumnBuilder = () => columnBuilders[columnBuilders.length - 1];

  const builder = {
    ifNotExists() {
      notExists = true;
      return builder;
    },

    column(name, type, ...params) {
      columnBuilders.push(columnDef(name, type, ...params));
      return builder;
    },

    primaryKey() {
      currentColumnBuilder().primaryKey();
      return builder;
    },

    notNull() {
      currentColumnBuilder().notNull();
      return builder;
    },

    unique() {
      currentColumnBuilder().unique();
      return builder;
    },

    default(value) {
      currentColumnBuilder().default(value);
      return builder;
    },

    references(refTable, refColumn) {
      currentColumnBuilder().references(refTable, refColumn);
      return builder;
    },

    build() {
      const columns = columnBuilders.map((cb) => cb.build());
      const exists = notExists ? "IF NOT EXISTS " : "";
      const colDefs = columns.map((c) => compileColumnDef(c)).join(", ");
      return { sql: `CREATE TABLE ${exists}${table} (${colDefs})` };
    },
  };

  return builder;
};

module.exports = { createTable };
