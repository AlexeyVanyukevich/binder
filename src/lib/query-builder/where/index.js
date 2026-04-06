const { compileWhere } = require("./compiler");

/**
 * @typedef {import('../..').WhereBuilder} WhereBuilder
 */

/**
 * @param {import('../..').ConditionItem | import('../..').Condition} input
 * @returns {WhereBuilder}
 */
const where = (input) => ({
  build() {
    return compileWhere(input);
  },
});

module.exports = { where, compileWhere };
