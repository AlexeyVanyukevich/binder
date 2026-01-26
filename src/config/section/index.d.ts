import { Config, ConfigObject, ConfigValue, ConfigValidationError } from '../index';

/**
 * A configuration section representing a subset of the configuration
 * Similar to C#'s IConfigurationSection
 */
export interface ConfigSection {
  /**
   * The key path of this section
   */
  readonly path: string;

  /**
   * The value of this section (if it's a leaf node)
   */
  readonly value: ConfigValue | undefined;

  /**
   * Gets a configuration value by key
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
   * Gets a nested configuration section
   */
  getSection(key: string): ConfigSection;

  /**
   * Binds section to a typed object
   */
  bind<T extends ConfigObject>(key: string): T;

  /**
   * Checks if a key exists
   */
  has(key: string): boolean;

  /**
   * Gets section data as a plain object
   */
  toObject(): ConfigObject;

  /**
   * Validates section (returns empty array for sections)
   */
  validate(): ConfigValidationError[];

  /**
   * Gets child sections
   */
  getChildren(): ConfigSection[];
}

/**
 * Creates a configuration section from data and path
 */
export declare function section(
  data: ConfigObject,
  path: string,
  parentConfig?: Config
): ConfigSection;
