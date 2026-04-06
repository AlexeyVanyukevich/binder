const compileColumns = require("../columns/compiler");
const { compileWhere } = require("../where/compiler");
const { compile: compileOrderBy } = require("../order-by/compiler");
const { compile: compileLimit } = require("../limit/compiler");
const { compile: compileOffset } = require("../offset/compiler");

/**
 * @typedef {import('../../query').Query} Query
 * @typedef {import('../ast').SelectNode} SelectNode
 */

/**
 * @param {SelectNode} node
 * @returns {Query}
 */
const compile = (node) => {
  const cols = compileColumns(node.columns);
  const parts = [`SELECT ${cols} FROM ${node.table}`];
  const params = [];

  if (node.where) {
    const w = compileWhere(node.where);
    parts.push(w.sql);
    params.push(...w.params);
  }

  if (node.orderBy) {
    parts.push(compileOrderBy(node.orderBy));
  }

  if (node.limit) {
    const l = compileLimit(node.limit);
    parts.push(l.sql);
    params.push(...l.params);
  }

  if (node.offset) {
    const o = compileOffset(node.offset);
    parts.push(o.sql);
    params.push(...o.params);
  }

  return { sql: parts.join(" "), params };
};

module.exports = { compile };
