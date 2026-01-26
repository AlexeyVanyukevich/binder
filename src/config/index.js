const { mergeProviders } = require('./provider');
const { section: createSection } = require('./section');

/**
 * @typedef {import('.').Config} Config
 * @typedef {import('.').ConfigOptions} ConfigOptions
 * @typedef {import('.').ConfigObject} ConfigObject
 * @typedef {import('.').ConfigValue} ConfigValue
 * @typedef {import('.').ConfigSchema} ConfigSchema
 * @typedef {import('.').ConfigSchemaField} ConfigSchemaField
 * @typedef {import('.').ConfigValidationError} ConfigValidationError
 * @typedef {import('./provider').ConfigProvider} ConfigProvider
 * @typedef {import('./section').ConfigSection} ConfigSection
 */

/**
 * Gets a nested value from an object using a key path
 * @param {ConfigObject} obj - The object to search
 * @param {string} key - The dot-notation key path
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
 * Converts a value to the specified type
 * @param {ConfigValue} value - The value to convert
 * @param {'string' | 'number' | 'boolean'} type - Target type
 * @returns {ConfigValue}
 */
const coerceValue = (value, type) => {
  if (value === undefined || value === null) {
    return value;
  }

  switch (type) {
    case 'number': {
      const num = Number(value);
      return isNaN(num) ? value : num;
    }
    case 'boolean': {
      if (typeof value === 'boolean') return value;
      if (value === 'true' || value === '1') return true;
      if (value === 'false' || value === '0') return false;
      return value;
    }
    default:
      return String(value);
  }
};

/**
 * Validates configuration against a schema
 * @param {ConfigObject} data - Configuration data
 * @param {ConfigSchema} schema - Schema to validate against
 * @param {string} [prefix=''] - Key prefix for nested validation
 * @returns {ConfigValidationError[]}
 */
const validateSchema = (data, schema, prefix = '') => {
  /** @type {ConfigValidationError[]} */
  const errors = [];

  for (const [key, fieldDef] of Object.entries(schema)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    const value = getNestedValue(data, key);

    // Check if it's a nested schema
    if (!('type' in fieldDef)) {
      const nestedData = /** @type {ConfigObject} */ (value) || {};
      errors.push(
        ...validateSchema(
          nestedData,
          /** @type {ConfigSchema} */ (fieldDef),
          fullKey
        )
      );
      continue;
    }

    const field = /** @type {ConfigSchemaField} */ (fieldDef);

    // Check required
    if (field.required && (value === undefined || value === null)) {
      errors.push({
        key: fullKey,
        message: `Required configuration key "${fullKey}" is missing`,
        expected: field.type,
      });
      continue;
    }

    // Check type
    if (value !== undefined && value !== null) {
      const actualType = typeof value;
      if (field.type !== 'object' && actualType !== field.type) {
        const coerced = coerceValue(value, field.type);
        if (typeof coerced !== field.type) {
          errors.push({
            key: fullKey,
            message: `Invalid type for "${fullKey}"`,
            expected: field.type,
            actual: actualType,
          });
        }
      }

      // Custom validation
      if (field.validate && !field.validate(value)) {
        errors.push({
          key: fullKey,
          message: `Validation failed for "${fullKey}"`,
        });
      }
    }
  }

  return errors;
};

/**
 * Applies schema defaults to configuration data
 * @param {ConfigObject} data - Configuration data
 * @param {ConfigSchema} schema - Schema with defaults
 * @returns {ConfigObject}
 */
const applyDefaults = (data, schema) => {
  /** @type {ConfigObject} */
  const result = { ...data };

  for (const [key, fieldDef] of Object.entries(schema)) {
    const value = result[key];

    // Handle nested schema
    if (!('type' in fieldDef)) {
      const nestedData = /** @type {ConfigObject} */ (value) || {};
      result[key] = applyDefaults(nestedData, /** @type {ConfigSchema} */ (fieldDef));
      continue;
    }

    const field = /** @type {ConfigSchemaField} */ (fieldDef);

    // Apply default if value is missing
    if ((value === undefined || value === null) && field.default !== undefined) {
      result[key] = field.default;
    }
  }

  return result;
};

/**
 * Creates a new configuration instance
 * @param {ConfigOptions} [options={}] - Configuration options
 * @returns {Config}
 */
const config = (options = {}) => {
  const { providers = [], schema, throwOnMissing = true } = options;

  // Merge all providers
  /** @type {ConfigObject} */
  let data = mergeProviders(providers);

  // Apply schema defaults if schema is provided
  if (schema) {
    data = applyDefaults(data, schema);
  }

  /**
   * Gets a configuration value by key
   * @template {ConfigValue} T
   * @param {string} key - The configuration key
   * @returns {T | undefined}
   */
  const get = (key) => {
    const value = getNestedValue(data, key);

    // If it's an object, return undefined (use getSection for objects)
    if (value !== null && typeof value === 'object') {
      return undefined;
    }

    return /** @type {T} */ (value);
  };

  /**
   * Gets a required configuration value
   * @template {ConfigValue} T
   * @param {string} key - The configuration key
   * @returns {T}
   * @throws {Error} If the key is not found
   */
  const getRequired = (key) => {
    const value = get(key);

    if (value === undefined || value === null) {
      throw new Error(`Required configuration key "${key}" is missing`);
    }

    return /** @type {T} */ (value);
  };

  /**
   * Gets a configuration value with a default
   * @template {ConfigValue} T
   * @param {string} key - The configuration key
   * @param {T} defaultValue - Default value if not found
   * @returns {T}
   */
  const getOrDefault = (key, defaultValue) => {
    const value = get(key);
    return value !== undefined && value !== null
      ? /** @type {T} */ (value)
      : defaultValue;
  };

  /**
   * Gets a configuration section
   * @param {string} key - The section key
   * @returns {ConfigSection}
   */
  const getSection = (key) => {
    const sectionData = getNestedValue(data, key);
    const sectionObj =
      typeof sectionData === 'object' && sectionData !== null
        ? /** @type {ConfigObject} */ (sectionData)
        : {};

    return createSection(sectionObj, key, configInstance);
  };

  /**
   * Binds configuration to a typed object
   * @template {ConfigObject} T
   * @param {string} key - The section key
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
   * Checks if a key exists
   * @param {string} key - The configuration key
   * @returns {boolean}
   */
  const has = (key) => {
    const value = getNestedValue(data, key);
    return value !== undefined;
  };

  /**
   * Returns all configuration as an object
   * @returns {ConfigObject}
   */
  const toObject = () => {
    return { ...data };
  };

  /**
   * Validates configuration against schema
   * @returns {ConfigValidationError[]}
   */
  const validate = () => {
    if (!schema) {
      return [];
    }
    return validateSchema(data, schema);
  };

  /**
   * @type {Config}
   */
  const configInstance = {
    get,
    getRequired,
    getOrDefault,
    getSection,
    bind,
    has,
    toObject,
    validate,
  };

  // Validate on creation if throwOnMissing is true
  if (throwOnMissing && schema) {
    const errors = validate();
    const requiredErrors = errors.filter((e) => e.message.includes('Required'));
    if (requiredErrors.length > 0) {
      throw new Error(
        `Configuration validation failed:\n${requiredErrors.map((e) => e.message).join('\n')}`
      );
    }
  }

  return configInstance;
};

const { envProvider } = require('./provider/env');
const { jsonProvider } = require('./provider/json');
const { dotenvProvider } = require('./provider/dotenv');

/**
 * Creates a configuration with default providers
 * @returns {Config}
 */
const createDefaultConfig = () => {
  return config({
    providers: [dotenvProvider(), envProvider()],
  });
};

/**
 * @typedef {import('.').SetupSchema<T>} SetupSchema
 * @template T
 */

/**
 * @typedef {import('.').SetupOptions} SetupOptions
 */

/**
 * Coerces a value to the target type
 * @param {ConfigValue} value - The value to coerce
 * @param {'string' | 'number' | 'boolean'} targetType - Target type
 * @returns {ConfigValue}
 */
const coerceToType = (value, targetType) => {
  if (value === undefined || value === null) {
    return undefined;
  }

  switch (targetType) {
    case 'number': {
      const num = Number(value);
      return isNaN(num) ? undefined : num;
    }
    case 'boolean': {
      if (typeof value === 'boolean') return value;
      if (value === 'true' || value === '1') return true;
      if (value === 'false' || value === '0') return false;
      return undefined;
    }
    case 'string':
    default:
      return String(value);
  }
};

/**
 * Recursively applies schema to build typed object
 * @param {ConfigObject} data - Source data
 * @param {Record<string, any>} schema - Schema definition
 * @param {string} path - Current path for error messages
 * @param {boolean} required - Whether to throw on missing
 * @returns {ConfigObject}
 */
const applySetupSchema = (data, schema, path, required) => {
  /** @type {ConfigObject} */
  const result = {};

  for (const [key, typeOrNested] of Object.entries(schema)) {
    const value = data[key];
    const fullPath = path ? `${path}.${key}` : key;

    if (typeof typeOrNested === 'object') {
      // Nested schema
      const nestedData =
        typeof value === 'object' && value !== null
          ? /** @type {ConfigObject} */ (value)
          : {};
      result[key] = applySetupSchema(nestedData, typeOrNested, fullPath, required);
    } else {
      // Primitive type
      const coerced = coerceToType(/** @type {ConfigValue} */ (value), typeOrNested);

      if (coerced === undefined && required) {
        throw new Error(`Required configuration key "${fullPath}" is missing or invalid`);
      }

      result[key] = coerced;
    }
  }

  return result;
};

/**
 * Binds configuration to a typed object with automatic type coercion
 * @template {ConfigObject} T
 * @param {Config} cfg - The configuration instance
 * @param {string} key - The section key (use empty string for root)
 * @param {Record<string, any>} schema - Object defining the shape and types
 * @param {SetupOptions} [options={}] - Setup options
 * @returns {T}
 *
 * @example
 * const dbConfig = setup(config, 'database', {
 *   host: 'string',
 *   port: 'number',
 *   ssl: 'boolean'
 * });
 */
const setup = (cfg, key, schema, options = {}) => {
  const { required = false } = options;

  const data = key ? cfg.bind(key) : cfg.toObject();

  return /** @type {T} */ (applySetupSchema(data, schema, key, required));
};

module.exports = {
  config,
  createDefaultConfig,
  setup,
  envProvider,
  jsonProvider,
  dotenvProvider,
};
