/**
 * @typedef {import('.').ConfigProvider} ConfigProvider
 * @typedef {import('..').ConfigObject} ConfigObject
 */

/**
 * Deep merges configuration objects
 * @param {ConfigObject} target - Target object
 * @param {ConfigObject} source - Source object to merge
 * @returns {ConfigObject}
 */
const deepMerge = (target, source) => {
  /** @type {ConfigObject} */
  const result = { ...target };

  for (const [key, value] of Object.entries(source)) {
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      const targetValue = result[key];
      if (
        targetValue !== null &&
        typeof targetValue === 'object' &&
        !Array.isArray(targetValue)
      ) {
        result[key] = deepMerge(
          /** @type {ConfigObject} */ (targetValue),
          /** @type {ConfigObject} */ (value)
        );
      } else {
        result[key] = value;
      }
    } else {
      result[key] = value;
    }
  }

  return result;
};

/**
 * Merges multiple providers into a single configuration object
 * Later providers override earlier ones
 * @param {ConfigProvider[]} providers - Array of configuration providers
 * @returns {ConfigObject}
 */
const mergeProviders = (providers) => {
  /** @type {ConfigObject} */
  let result = {};

  for (const provider of providers) {
    const providerData = provider.load();
    result = deepMerge(result, providerData);
  }

  return result;
};

module.exports = { mergeProviders };
