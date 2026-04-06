const { UNIQUE_TYPE } = require("./types");

/** @type {import('.').UniqueBuilder} */
const build = () => ({ type: UNIQUE_TYPE });

module.exports = { build };
