const { compile } = require("../condition/compiler");

/**
 * @typedef {import('../../condition/condition-item/types').ConditionItem} ConditionItem
 * @typedef {import('../../condition/types').Condition} Condition
 * @typedef {import('../../query').Query} Query
 */

/**
 * @param {ConditionItem | Condition} input
 * @returns {Query}
 */
const compileWhere = (input) => {
  const result = compile(input);
  if (!result.sql) return { sql: "", params: [] };
  return { sql: `WHERE ${result.sql}`, params: result.params };
};

module.exports = { compileWhere };
