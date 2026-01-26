const { readFileSync, existsSync } = require('fs');
const { resolve } = require('path');

/**
 * @typedef {import('..').ConfigProvider} ConfigProvider
 * @typedef {import('../..').ConfigObject} ConfigObject
 * @typedef {import('.').JsonProviderOptions} JsonProviderOptions
 */

/**
 * Creates a JSON file configuration provider
 * @param {JsonProviderOptions} options - Provider options
 * @returns {ConfigProvider}
 */
const jsonProvider = (options) => {
  const { path, optional = false, encoding = 'utf-8' } = options;

  const resolvedPath = resolve(path);

  /**
   * Loads configuration from a JSON file
   * @returns {ConfigObject}
   */
  const load = () => {
    if (!existsSync(resolvedPath)) {
      if (optional) {
        return {};
      }
      throw new Error(`Configuration file not found: ${resolvedPath}`);
    }

    try {
      const content = readFileSync(resolvedPath, encoding);
      const parsed = JSON.parse(content);

      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        throw new Error(
          `Configuration file must contain a JSON object: ${resolvedPath}`
        );
      }

      return /** @type {ConfigObject} */ (parsed);
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error(`Invalid JSON in configuration file: ${resolvedPath}`);
      }
      throw error;
    }
  };

  return {
    name: `json:${path}`,
    load,
  };
};

module.exports = { jsonProvider };
