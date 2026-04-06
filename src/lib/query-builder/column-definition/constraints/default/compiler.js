/** @type {import('.').DefaultCompiler} */
const compile = (node) => `DEFAULT ${node.value}`;

module.exports = { compile };
