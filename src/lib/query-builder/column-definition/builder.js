const { dataType } = require("./data-type");
const { build: primaryKey } = require("./constraints/primary-key/builder");
const { build: notNull } = require("./constraints/not-null/builder");
const { build: unique } = require("./constraints/unique/builder");
const { build: defaultValue } = require("./constraints/default/builder");
const { build: references } = require("./constraints/references/builder");

/**
 * @typedef {import('../..').ColumnDefinitionBuilder} ColumnDefinitionBuilder
 */

/**
 * @param {string} name
 * @param {import('../..').DataType} type
 * @param {...number} params
 * @returns {ColumnDefinitionBuilder}
 */
const columnDef = (name, type, ...params) => {
  const constraints = [];

  const addConstraint = (constraint) => {
    constraints.push(constraint);
    return builder;
  };

  const builder = {
    primaryKey() { return addConstraint(primaryKey()); },
    notNull() { return addConstraint(notNull()); },
    unique() { return addConstraint(unique()); },
    default(value) { return addConstraint(defaultValue(value)); },
    references(table, column) { return addConstraint(references(table, column)); },

    build() {
      return { name, type: dataType(type, ...params), constraints };
    },
  };

  return builder;
};

module.exports = { columnDef };
