/**
 * @typedef {import('../..').OrderByBuilder_} OrderByBuilder_
 */

/**
 * @returns {OrderByBuilder_}
 */
const orderBy = () => {
  const items = [];

  const builder = {
    asc(column) {
      items.push({ column, direction: "ASC" });
      return builder;
    },

    desc(column) {
      items.push({ column, direction: "DESC" });
      return builder;
    },

    build() {
      return { items };
    },
  };

  return builder;
};

module.exports = { orderBy };
