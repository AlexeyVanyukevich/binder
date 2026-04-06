/**
 * @typedef {import('../..').ColumnsBuilder} ColumnsBuilder
 */

/**
 * @returns {ColumnsBuilder}
 */
const columns = () => {
  const cols = [];

  const builder = {
    add(...names) {
      cols.push(...names);
      return builder;
    },

    build() {
      return { columns: cols.length ? cols : ["*"] };
    },
  };

  return builder;
};

module.exports = { columns };
