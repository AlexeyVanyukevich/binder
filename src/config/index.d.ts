import { ConfigProvider } from './provider';
import { ConfigSection } from './section';

/**
 * Configuration value types supported by the system
 */
export type ConfigValue = string | number | boolean | null | undefined;

/**
 * Configuration object that can be nested
 */
export type ConfigObject = {
  [key: string]: ConfigValue | ConfigObject;
};

/**
 * Schema field definition for validation
 */
export interface ConfigSchemaField {
  type: 'string' | 'number' | 'boolean' | 'object';
  required?: boolean;
  default?: ConfigValue;
  description?: string;
  validate?: (value: ConfigValue) => boolean;
}

/**
 * Schema definition for configuration validation
 */
export interface ConfigSchema {
  [key: string]: ConfigSchemaField | ConfigSchema;
}

/**
 * Validation error returned when configuration is invalid
 */
export interface ConfigValidationError {
  key: string;
  message: string;
  expected?: string;
  actual?: string;
}

/**
 * Options for creating a configuration instance
 */
export interface ConfigOptions {
  /**
   * Configuration providers in order of precedence (later overrides earlier)
   */
  providers?: ConfigProvider[];

  /**
   * Schema for validation (optional)
   */
  schema?: ConfigSchema;

  /**
   * Whether to throw on missing required values (default: true)
   */
  throwOnMissing?: boolean;
}

/**
 * Main configuration interface (similar to C#'s IConfiguration)
 */
export interface Config {
  /**
   * Gets a configuration value by key path (supports dot notation)
   * @example config.get('database.host')
   */
  get<T extends ConfigValue = string>(key: string): T | undefined;

  /**
   * Gets a configuration value or throws if not found
   */
  getRequired<T extends ConfigValue = string>(key: string): T;

  /**
   * Gets a configuration value with a default fallback
   */
  getOrDefault<T extends ConfigValue = string>(key: string, defaultValue: T): T;

  /**
   * Gets a configuration section (nested configuration)
   * Similar to C#'s IConfiguration.GetSection()
   */
  getSection(key: string): ConfigSection;

  /**
   * Binds configuration to a typed object
   * Similar to C#'s IConfiguration.Bind()
   */
  bind<T extends ConfigObject>(key: string): T;

  /**
   * Checks if a configuration key exists
   */
  has(key: string): boolean;

  /**
   * Gets all configuration as a plain object
   */
  toObject(): ConfigObject;

  /**
   * Validates configuration against the schema
   * @returns Array of validation errors (empty if valid)
   */
  validate(): ConfigValidationError[];
}

/**
 * Creates a new configuration instance
 */
export declare function config(options?: ConfigOptions): Config;

/**
 * Creates a configuration with default providers (env, .env file)
 */
export declare function createDefaultConfig(): Config;

/**
 * Setup schema defining the shape and types of configuration
 */
export type SetupSchema<T> = {
  [K in keyof T]: T[K] extends object
    ? SetupSchema<T[K]>
    : 'string' | 'number' | 'boolean';
};

/**
 * Options for the setup function
 */
export interface SetupOptions {
  /**
   * Whether to throw if a required key is missing (default: false)
   */
  required?: boolean;
}

/**
 * Binds configuration to a typed object with automatic type coercion
 * @param cfg - The configuration instance
 * @param key - The section key (use empty string for root)
 * @param schema - Object defining the shape and types
 * @param options - Setup options
 * @returns Typed configuration object
 *
 * @example
 * const dbConfig = setup(config, 'database', {
 *   host: 'string',
 *   port: 'number',
 *   ssl: 'boolean'
 * });
 * // Returns { host: 'localhost', port: 5432, ssl: false }
 */
export declare function setup<T extends ConfigObject>(
  cfg: Config,
  key: string,
  schema: SetupSchema<T>,
  options?: SetupOptions
): T;

export { envProvider } from './provider/env';
export { jsonProvider } from './provider/json';
export { dotenvProvider } from './provider/dotenv';
