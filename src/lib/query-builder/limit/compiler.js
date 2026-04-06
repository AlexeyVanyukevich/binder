/**
 * @type {import('.').LimitCompiler}
 */
const compile = (node) => ({
  sql: "LIMIT ?",
  params: [node.value],
});

module.exports = { compile };
