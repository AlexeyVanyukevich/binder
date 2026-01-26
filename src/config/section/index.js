/**
 * @typedef {import('.').ConfigSection} ConfigSection
 * @typedef {import('..').Config} Config
 * @typedef {import('..').ConfigObject} ConfigObject
 * @typedef {import('..').ConfigValue} ConfigValue
 * @typedef {import('..').ConfigValidationError} ConfigValidationError
 */

/**
 * Gets a nested value from an object
 * @param {ConfigObject} obj - The object
 * @param {string} key - The key (dot notation)
 * @returns {ConfigValue | ConfigObject | undefined}
 */
const getNestedValue = (obj, key) => {
  const segments = key.split('.').filter(Boolean);
  /** @type {ConfigValue | ConfigObject | undefined} */
  let current = obj;

  for (const segment of segments) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return undefined;
    }
    current = /** @type {ConfigObject} */ (current)[segment];
  }

  return current;
};

/**
 * Creates a configuration section
 * @param {ConfigObject} data - Section data
 * @param {string} path - Section path
 * @param {Config} [parentConfig] - Parent config (optional)
 * @returns {ConfigSection}
 */
const section = (data, path, parentConfig) => {
  /**
   * @template {ConfigValue} T
   * @param {string} key
   * @returns {T | undefined}
   */
  const get = (key) => {
    const value = getNestedValue(data, key);
    if (value !== null && typeof value === 'object') {
      return undefined;
    }
    return /** @type {T} */ (value);
  };

  /**
   * @template {ConfigValue} T
   * @param {string} key
   * @returns {T}
   */
  const getRequired = (key) => {
    const value = get(key);
    if (value === undefined || value === null) {
      throw new Error(`Required configuration key "${path}.${key}" is missing`);
    }
    return /** @type {T} */ (value);
  };

  /**
   * @template {ConfigValue} T
   * @param {string} key
   * @param {T} defaultValue
   * @returns {T}
   */
  const getOrDefault = (key, defaultValue) => {
    const value = get(key);
    return value !== undefined && value !== null
      ? /** @type {T} */ (value)
      : defaultValue;
  };

  /**
   * @param {string} key
   * @returns {ConfigSection}
   */
  const getSection = (key) => {
    const sectionData = getNestedValue(data, key);
    const sectionObj =
      typeof sectionData === 'object' && sectionData !== null
        ? /** @type {ConfigObject} */ (sectionData)
        : {};

    return section(sectionObj, `${path}.${key}`, parentConfig);
  };

  /**
   * @template {ConfigObject} T
   * @param {string} key
   * @returns {T}
   */
  const bind = (key) => {
    const sectionData = getNestedValue(data, key);
    if (typeof sectionData !== 'object' || sectionData === null) {
      return /** @type {T} */ ({});
    }
    return /** @type {T} */ (sectionData);
  };

  /**
   * @param {string} key
   * @returns {boolean}
   */
  const has = (key) => {
    return getNestedValue(data, key) !== undefined;
  };

  /**
   * @returns {ConfigObject}
   */
  const toObject = () => {
    return { ...data };
  };

  /**
   * @returns {ConfigValidationError[]}
   */
  const validate = () => {
    return []; // Sections don't have schemas by default
  };

  /**
   * Gets child sections
   * @returns {ConfigSection[]}
   */
  const getChildren = () => {
    /** @type {ConfigSection[]} */
    const children = [];

    for (const key of Object.keys(data)) {
      const value = data[key];
      if (typeof value === 'object' && value !== null) {
        children.push(
          section(/** @type {ConfigObject} */ (value), `${path}.${key}`, parentConfig)
        );
      }
    }

    return children;
  };

  /**
   * Gets the primitive value of this section (if any)
   * @returns {ConfigValue | undefined}
   */
  const getValue = () => {
    const keys = Object.keys(data);
    if (keys.length === 0) {
      return undefined;
    }
    return undefined;
  };

  return {
    path,
    value: getValue(),
    get,
    getRequired,
    getOrDefault,
    getSection,
    bind,
    has,
    toObject,
    validate,
    getChildren,
  };
};

module.exports = { section };
