const { REFERENCES_TYPE } = require("./types");

/** @type {import('.').ReferencesBuilder} */
const build = (table, column) => ({ type: REFERENCES_TYPE, table, column });

module.exports = { build };
