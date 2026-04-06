const { compile: compileColumnDef } = require("./column-definition");

/**
 * @typedef {import('.').Query} Query
 * @typedef {import('.').AlterAction} AlterAction
 * @typedef {import('.').AlterTableBuilder} AlterTableBuilder
 */

/**
 * @param {string} table
 * @returns {AlterTableBuilder}
 */
const alterTable = (table) => {
  /** @type {AlterAction[]} */
  const actions = [];

  const builder = {
    addColumn(column) {
      actions.push({ type: "addColumn", column });
      return builder;
    },

    dropColumn(name) {
      actions.push({ type: "dropColumn", name });
      return builder;
    },

    renameColumn(from, to) {
      actions.push({ type: "renameColumn", from, to });
      return builder;
    },

    build() {
      const clauses = actions.map((action) => {
        switch (action.type) {
          case "addColumn":
            return `ADD COLUMN ${compileColumnDef(action.column)}`;
          case "dropColumn":
            return `DROP COLUMN ${action.name}`;
          case "renameColumn":
            return `RENAME COLUMN ${action.from} TO ${action.to}`;
          default:
            throw new Error(`Unknown alter action: ${/** @type {any} */ (action).type}`);
        }
      });
      return { sql: `ALTER TABLE ${table} ${clauses.join(", ")}` };
    },
  };

  return builder;
};

module.exports = { alterTable };
