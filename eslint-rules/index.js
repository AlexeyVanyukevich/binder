'use strict';

/**
  * @typedef {import('eslint').Linter.RulesRecord} RulesRecord
 */

const fs = require('fs');
const path = require('path');

const currentFile = path.resolve(__filename);

/**
 *
 * @param {string} dir
 * @param {string} [baseDir]
 * @returns {string[]}
 */
const getRelativeFilePaths = (dir, baseDir = dir) => {
  /** @type {string[]} */
  let results = [];

  fs.readdirSync(dir).forEach((file) => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (fullPath === currentFile) {
      return;
    }

    if (stat.isDirectory()) {
      results = results.concat(getRelativeFilePaths(fullPath, baseDir));
    } else {
      const relativePath =
        './' + path.relative(baseDir, fullPath).replace(/\\/g, '/');
      results.push(relativePath);
    }
  });

  return results;
};

const baseDir = path.resolve(__dirname, './');

/**
 * @return {Partial<RulesRecord>[]}
 */
const init = () => {
  return getRelativeFilePaths(baseDir, __dirname).map(require);
}

module.exports = init
