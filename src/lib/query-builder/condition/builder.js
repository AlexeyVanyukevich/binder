/**
 * @typedef {import('../..').ConditionBuilder_} ConditionBuilder_
 */

/**
 * @returns {ConditionBuilder_}
 */
const condition = () => {
  let logic = "AND";
  const children = [];

  const builder = {
    and() {
      logic = "AND";
      return builder;
    },

    or() {
      logic = "OR";
      return builder;
    },

    add(child) {
      children.push(child);
      return builder;
    },

    build() {
      return { logic, children };
    },
  };

  return builder;
};

module.exports = { condition };
