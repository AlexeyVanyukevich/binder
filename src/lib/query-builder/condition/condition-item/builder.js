/**
 * @typedef {import('../../..').ConditionItemBuilder} ConditionItemBuilder
 */

/**
 * @param {string} field
 * @returns {ConditionItemBuilder}
 */
const conditionItem = (field) => {
  let operation;
  let value;

  const done = (op, val) => {
    operation = op;
    value = val;
    return builder;
  };

  const builder = {
    eq(val) { return done("=", val); },
    neq(val) { return done("!=", val); },
    lt(val) { return done("<", val); },
    gt(val) { return done(">", val); },
    lte(val) { return done("<=", val); },
    gte(val) { return done(">=", val); },
    like(val) { return done("LIKE", val); },
    in(val) { return done("IN", val); },

    build() {
      return { left: field, operation, right: value };
    },
  };

  return builder;
};

module.exports = { conditionItem };
