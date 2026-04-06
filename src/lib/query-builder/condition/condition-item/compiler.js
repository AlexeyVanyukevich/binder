/**
 * @type {import('.').ConditionItemCompiler}
 */
const compile = (item) => ({
  sql: `${item.left} ${item.operation} ?`,
  params: [item.right],
});

module.exports = { compile };
