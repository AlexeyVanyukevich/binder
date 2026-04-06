/** @type {import('.').ReferencesCompiler} */
const compile = (node) => `REFERENCES ${node.table}(${node.column})`;

module.exports = { compile };
