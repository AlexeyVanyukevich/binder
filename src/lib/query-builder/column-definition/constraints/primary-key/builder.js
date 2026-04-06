const { PRIMARY_KEY_TYPE } = require("./types");

/** @type {import('.').PrimaryKeyBuilder} */
const build = () => ({ type: PRIMARY_KEY_TYPE });

module.exports = { build };
