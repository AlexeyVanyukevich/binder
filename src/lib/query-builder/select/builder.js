const { columns } = require("../columns/builder");
const { orderBy } = require("../order-by/builder");
const { limit } = require("../limit/builder");
const { offset } = require("../offset/builder");
const { compile } = require("./compiler");

/**
 * @typedef {import('../..').Query} Query
 * @typedef {import('../..').SelectBuilder} SelectBuilder
 */

/**
 * @param {string} table
 * @returns {SelectBuilder}
 */
const select = (table) => {
  const colsBuilder = columns();
  const orderByBuilder = orderBy();
  let whereClause;
  let limitValue;
  let offsetValue;

  const builder = {
    columns(...cols) {
      cols.forEach((c) => colsBuilder.add(c));
      return builder;
    },

    where(condition) {
      whereClause = condition;
      return builder;
    },

    asc(column) {
      orderByBuilder.asc(column);
      return builder;
    },

    desc(column) {
      orderByBuilder.desc(column);
      return builder;
    },

    limit(value) {
      limitValue = value;
      return builder;
    },

    offset(value) {
      offsetValue = value;
      return builder;
    },

    build() {
      const node = {
        type: "select",
        table,
        columns: colsBuilder.build(),
      };

      if (whereClause) node.where = whereClause;

      const ob = orderByBuilder.build();
      if (ob.items.length) node.orderBy = ob;

      if (limitValue !== undefined) node.limit = limit(limitValue).build();
      if (offsetValue !== undefined) node.offset = offset(offsetValue).build();

      return compile(node);
    },
  };

  return builder;
};

module.exports = { select };
