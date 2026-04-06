/**
 * @ptype {import('.').OffsetCompiler}
 */
const compile = (node) => ({
  sql: "OFFSET ?",
  params: [node.value],
});

module.exports = { compile };
