import { Config, ConfigObject } from "..";

/**
 * Setup schema defining the shape and types of configuration
 */
export type SetupSchema<T> = {
  [K in keyof T]: T[K] extends object
    ? SetupSchema<T[K]>
    : "string" | "number" | "boolean";
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
  cnf: Config,
  key: string,
  schema: SetupSchema<T>,
  options?: SetupOptions
): T;
