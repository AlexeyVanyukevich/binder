/**
 * @typedef {import('../..').OffsetBuilder_} OffsetBuilder_
 */

/**
 * @param {number} value
 * @returns {OffsetBuilder_}
 */
const offset = (value) => ({
  build() {
    return { value };
  },
});

module.exports = { offset };
