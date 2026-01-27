/**
 * @typedef {import("..").Config} Config
 * @typedef {import("..").ConfigObject} ConfigObject
 * @typedef {import("..").ConfigValue} ConfigValue
 * @typedef {import(".").SetupOptions} SetupOptions
 */

/**
 * @template {ConfigObject} T
 * @typedef {import(".").SetupSchema<T>} SetupSchema
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
    case "number": {
      const num = Number(value);
      return isNaN(num) ? undefined : num;
    }
    case "boolean": {
      if (typeof value === "boolean") return value;
      if (value === "true" || value === "1") return true;
      if (value === "false" || value === "0") return false;
      return undefined;
    }
    case "string":
    default:
      return String(value);
  }
};

/**
 * Recursively applies schema to build typed object
 * @param {ConfigObject} data - Source data
 * @param {SetupSchema} schema - Schema definition
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

    if (typeof typeOrNested === "object") {
      // Nested schema
      const nestedData =
        typeof value === "object" && value !== null
          ? /** @type {ConfigObject} */ (value)
          : {};
      result[key] = applySetupSchema(
        nestedData,
        typeOrNested,
        fullPath,
        required
      );
    } else {
      // Primitive type
      const coerced = coerceToType(
        /** @type {ConfigValue} */ (value),
        typeOrNested
      );

      if (coerced === undefined && required) {
        throw new Error(
          `Required configuration key "${fullPath}" is missing or invalid`
        );
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
 * @param {SetupSchema<T>} schema - Object defining the shape and types
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


module.exports = { setup };