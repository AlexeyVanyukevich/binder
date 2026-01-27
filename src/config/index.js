const { mergeProviders } = require("./provider");
const { section: createSection } = require("./section");
const { setup: setupFunc } = require("./setup");

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
  const segments = key.split(".").filter(Boolean);
  /** @type {ConfigValue | ConfigObject | undefined} */
  let current = obj;

  for (const segment of segments) {
    if (
      current === null ||
      current === undefined ||
      typeof current !== "object"
    ) {
      return undefined;
    }
    current = /** @type {ConfigObject} */ (current)[segment];
  }

  return current;
};

/**
 * Validates configuration against a schema
 * @param {ConfigObject} data - Configuration data
 * @param {ConfigSchema} schema - Schema to validate against
 * @param {string} [prefix=''] - Key prefix for nested validation
 * @returns {ConfigValidationError[]}
 */
const validateSchema = (data, schema, prefix = "") => {
  /** @type {ConfigValidationError[]} */
  const errors = [];

  for (const [key, fieldDef] of Object.entries(schema)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    const value = getNestedValue(data, key);

    // Check if it's a nested schema
    if (!("type" in fieldDef)) {
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
      if (field.type !== "object" && actualType !== field.type) {
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
    if (!("type" in fieldDef)) {
      const nestedData = /** @type {ConfigObject} */ (value) || {};
      result[key] = applyDefaults(
        nestedData,
        /** @type {ConfigSchema} */ (fieldDef)
      );
      continue;
    }

    const field = /** @type {ConfigSchemaField} */ (fieldDef);

    // Apply default if value is missing
    if (
      (value === undefined || value === null) &&
      field.default !== undefined
    ) {
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
    if (value !== null && typeof value === "object") {
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
      typeof sectionData === "object" && sectionData !== null
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

    if (typeof sectionData !== "object" || sectionData === null) {
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

  /**   * Sets up configuration binding with schema
   * @template {ConfigObject} T
   * @param {string | SetupSchema<T>} keyOrSchema - Section key or schema
   * @param {SetupSchema<T> | SetupOptions} [schemaOrOptions] - Schema or options
   * @param {SetupOptions} [options={}] - Setup options
   * @returns {T}
   */
  const setup = (keyOrSchema, schemaOrOptions, options = {}) => {
    const runKey = typeof keyOrSchema === "string" ? keyOrSchema : "";
    const runSchema =
      typeof keyOrSchema === "string" ? schemaOrOptions : keyOrSchema;
    const runOptions =
      typeof keyOrSchema === "string" ? options : schemaOrOptions;
    return setupFunc(configInstance, runKey, runSchema, runOptions);
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
    setup,
  };

  // Validate on creation if throwOnMissing is true
  if (throwOnMissing && schema) {
    const errors = validate();
    const requiredErrors = errors.filter((e) => e.message.includes("Required"));
    if (requiredErrors.length > 0) {
      throw new Error(
        `Configuration validation failed:\n${requiredErrors.map((e) => e.message).join("\n")}`
      );
    }
  }

  return configInstance;
};

const { envProvider } = require("./provider/env");
const { jsonProvider } = require("./provider/json");
const { dotenvProvider } = require("./provider/dotenv");

/**
 * Creates a configuration with default providers
 * @returns {Config}
 */
const createDefaultConfig = () => {
  return config({
    providers: [dotenvProvider(), envProvider()],
  });
};


module.exports = {
  config,
  createDefaultConfig,
  envProvider,
  jsonProvider,
  dotenvProvider,
};
