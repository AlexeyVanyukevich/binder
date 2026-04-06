import { ConfigProvider } from '..';

/**
 * Options for the environment provider
 */
export interface EnvProviderOptions {
  /**
   * Only include env vars with this prefix
   */
  prefix?: string;

  /**
   * Separator for nested keys (e.g., DATABASE__HOST)
   * @default '__'
   */
  separator?: string;

  /**
   * Remove prefix from keys
   * @default true
   */
  removePrefix?: boolean;

  /**
   * Environment object (for testing)
   * @default process.env
   */
  envObject?: Record<string, string | undefined>;
}

/**
 * Creates an environment variable configuration provider
 */
export declare function envProvider(options?: EnvProviderOptions): ConfigProvider;
