const { NOT_NULL_TYPE } = require("./types");

/** @type {import('.').NotNullBuilder} */
const build = () => ({ type: NOT_NULL_TYPE });

module.exports = { build };
