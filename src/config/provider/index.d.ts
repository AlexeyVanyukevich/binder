import { ConfigObject, ConfigValue } from '../index';

/**
 * Configuration provider interface
 * Each provider knows how to load configuration from a specific source
 */
export interface ConfigProvider {
  /**
   * Provider name for debugging/logging
   */
  readonly name: string;

  /**
   * Loads configuration and returns an object
   */
  load(): ConfigObject;

  /**
   * Gets a single value (optional optimization)
   */
  get?(key: string): ConfigValue | undefined;
}

/**
 * Merges multiple providers into a single configuration object
 * Later providers override earlier ones
 */
export declare function mergeProviders(providers: ConfigProvider[]): ConfigObject;
