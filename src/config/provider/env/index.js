/**
 * @typedef {import('..').ConfigProvider} ConfigProvider
 * @typedef {import('../..').ConfigObject} ConfigObject
 * @typedef {import('.').EnvProviderOptions} EnvProviderOptions
 */

/**
 * Converts an environment key to a nested object path
 * @param {string} key - The environment variable key
 * @param {string} separator - The separator for nested keys
 * @returns {string[]} Array of path segments
 */
const parseEnvKey = (key, separator) => {
  return key.toLowerCase().split(separator);
};

/**
 * Sets a nested value in an object
 * @param {ConfigObject} obj - The object to modify
 * @param {string[]} path - The path segments
 * @param {string} value - The value to set
 */
const setNestedValue = (obj, path, value) => {
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
 * Creates an environment variable configuration provider
 * @param {EnvProviderOptions} [options={}] - Provider options
 * @returns {ConfigProvider}
 */
const envProvider = (options = {}) => {
  const {
    prefix = '',
    separator = '__',
    removePrefix = true,
    envObject = process.env,
  } = options;

  /**
   * Loads environment variables into a configuration object
   * @returns {ConfigObject}
   */
  const load = () => {
    /** @type {ConfigObject} */
    const result = {};

    for (const [key, value] of Object.entries(envObject)) {
      if (value === undefined) continue;

      // Filter by prefix
      if (prefix && !key.startsWith(prefix)) {
        continue;
      }

      // Remove prefix if configured
      let processedKey = key;
      if (prefix && removePrefix) {
        processedKey = key.slice(prefix.length);
        // Remove leading separator if present
        if (processedKey.startsWith(separator)) {
          processedKey = processedKey.slice(separator.length);
        }
      }

      // Parse nested keys
      const pathSegments = parseEnvKey(processedKey, separator);
      setNestedValue(result, pathSegments, value);
    }

    return result;
  };

  /**
   * Gets a single value from environment
   * @param {string} key - The key to get (dot notation)
   * @returns {string | undefined}
   */
  const get = (key) => {
    // Convert dot notation to env var format
    const envKey = prefix + key.toUpperCase().replace(/\./g, separator);
    return envObject[envKey];
  };

  return {
    name: 'env',
    load,
    get,
  };
};

module.exports = { envProvider };
