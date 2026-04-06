const { columnType } = require("./data-type");
const { compile: compileConstraint } = require("./constraints");

/** @type {import('.').ColumnDefinitionCompiler} */
const compile = (col) => {
  const parts = [col.name, columnType(col.type)];
  if (col.constraints) {
    for (const constraint of col.constraints) {
      parts.push(compileConstraint(constraint));
    }
  }
  return parts.join(" ");
};

module.exports = { compile };
