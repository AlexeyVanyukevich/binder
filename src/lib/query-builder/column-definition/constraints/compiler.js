const { PRIMARY_KEY_TYPE, compile: primaryKeyCompile } = require("./primary-key");
const { NOT_NULL_TYPE, compile: notNullCompile } = require("./not-null");
const { UNIQUE_TYPE, compile: uniqueCompile } = require("./unique");
const { DEFAULT_TYPE, compile: defaultCompile } = require("./default");
const { REFERENCES_TYPE, compile: referencesCompile } = require("./references");

const compilers = {
  [PRIMARY_KEY_TYPE]: primaryKeyCompile,
  [NOT_NULL_TYPE]: notNullCompile,
  [UNIQUE_TYPE]: uniqueCompile,
  [DEFAULT_TYPE]: defaultCompile,
  [REFERENCES_TYPE]: referencesCompile,
};

/** @type {import('.').ConstraintCompiler} */
const compile = (node) => {
  const compiler = compilers[node.type];
  if (!compiler) {
    throw new Error(`Unknown constraint type: ${node.type}`);
  }
  return compiler(node);
};

module.exports = { compile };
