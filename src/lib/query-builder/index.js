const { select } = require("./select");
const { insert } = require("./insert");
const { update } = require("./update");
const { remove } = require("./remove");
const { createTable } = require("./create-table");
const { alterTable } = require("./alter-table");
const { dropTable } = require("./drop-table");

/** @typedef {import('.').QueryBuilder} QueryBuilder */

/**
 * Creates a standard SQL query builder.
 * @returns {QueryBuilder}
 */
const queryBuilder = () => ({
  select,
  insert,
  update,
  remove,
  createTable,
  alterTable,
  dropTable,
});

module.exports = { queryBuilder };
