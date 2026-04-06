/**
 * @type {import('.').OrderByCompiler}
 */
const compile = (node) => {
  const clauses = node.items.map((o) => `${o.column} ${o.direction}`);
  return `ORDER BY ${clauses.join(", ")}`;
};

module.exports = { compile };
