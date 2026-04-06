const { compile: compileItem } = require("./condition-item/compiler");

/**
 * @typedef {import('../condition-item/types').ConditionItem} ConditionItem
 * @typedef {import('../types').Condition} Condition
 * @typedef {import('../../query').Query} Query
 */

/**
 * @param {ConditionItem | Condition} input
 * @returns {boolean}
 */
const isConditionItem = (input) => "left" in input;

/**
 * @param {ConditionItem | Condition} input
 * @returns {Query}
 */
const compile = (input) => {
  if (isConditionItem(input)) {
    return compileItem(input);
  }

  const clauses = [];
  const params = [];

  for (const child of input.children) {
    const result = compile(child);
    if (result.sql) {
      clauses.push(result.sql);
      params.push(...result.params);
    }
  }

  if (clauses.length === 0) return { sql: "", params: [] };
  if (clauses.length === 1) return { sql: clauses[0], params };

  const logic = input.logic || "AND";
  return {
    sql: `(${clauses.join(` ${logic} `)})`,
    params,
  };
};

module.exports = { compile };
