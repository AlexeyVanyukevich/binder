/**
 * @typedef {import('../..').LimitBuilder_} LimitBuilder_
 */

/**
 * @param {number} value
 * @returns {LimitBuilder_}
 */
const limit = (value) => ({
  build() {
    return { value };
  },
});

module.exports = { limit };
