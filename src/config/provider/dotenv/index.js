const { readFileSync, existsSync } = require('fs');
const { resolve } = require('path');

/**
 * @typedef {import('..').ConfigProvider} ConfigProvider
 * @typedef {import('../..').ConfigObject} ConfigObject
 * @typedef {import('.').DotenvProviderOptions} DotenvProviderOptions
 */

/**
 * Parses a .env file line
 * @param {string} line - The line to parse
 * @returns {{ key: string, value: string } | null}
 */
const parseLine = (line) => {
  const trimmed = line.trim();

  // Skip empty lines and comments
  if (trimmed === '' || trimmed.startsWith('#')) {
    return null;
  }

  const equalsIndex = trimmed.indexOf('=');
  if (equalsIndex === -1) {
    return null;
  }

  const key = trimmed.slice(0, equalsIndex).trim();
  let value = trimmed.slice(equalsIndex + 1).trim();

  // Remove quotes
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }

  return { key, value };
};

/**
 * Converts an environment key to nested object path
 * @param {string} key - The key to convert
 * @param {string} separator - The separator
 * @returns {string[]}
 */
const parseKey = (key, separator) => {
  return key.toLowerCase().split(separator);
};

/**
 * Sets a nested value in an object
 * @param {ConfigObject} obj - The object
 * @param {string[]} path - The path
 * @param {string} value - The value
 */
const setNested = (obj, path, value) => {
  let current = obj;

  for (let i = 0; i < path.length - 1; i++) {
    const segment = path[i];
    if (!(segment in current) || typeof current[segment] !== 'object') {
      current[segment] = {};
    }
    current = /** @type {ConfigObject} */ (current[segment]);
  }

  current[path[path.length - 1]] = value;
};

/**
 * Creates a .env file configuration provider
 * @param {DotenvProviderOptions} [options={}] - Provider options
 * @returns {ConfigProvider}
 */
const dotenvProvider = (options = {}) => {
  const { path = '.env', optional = true, separator = '__' } = options;

  const resolvedPath = resolve(path);

  /**
   * Loads configuration from a .env file
   * @returns {ConfigObject}
   */
  const load = () => {
    if (!existsSync(resolvedPath)) {
      if (optional) {
        return {};
      }
      throw new Error(`.env file not found: ${resolvedPath}`);
    }

    /** @type {ConfigObject} */
    const result = {};

    const content = readFileSync(resolvedPath, 'utf-8');
    const lines = content.split('\n');

    for (const line of lines) {
      const parsed = parseLine(line);
      if (parsed) {
        const pathSegments = parseKey(parsed.key, separator);
        setNested(result, pathSegments, parsed.value);
      }
    }

    return result;
  };

  return {
    name: `dotenv:${path}`,
    load,
  };
};

module.exports = { dotenvProvider };
