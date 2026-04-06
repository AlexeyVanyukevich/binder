const { DEFAULT_TYPE } = require("./types");

/** @type {import('.').DefaultBuilder} */
const build = (value) => ({ type: DEFAULT_TYPE, value });

module.exports = { build };
