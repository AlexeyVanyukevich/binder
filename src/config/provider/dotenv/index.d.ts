import { ConfigProvider } from '../index';

/**
 * Options for the dotenv provider
 */
export interface DotenvProviderOptions {
  /**
   * Path to the .env file
   * @default '.env'
   */
  path?: string;

  /**
   * Don't throw if file doesn't exist
   * @default true
   */
  optional?: boolean;

  /**
   * Separator for nested keys
   * @default '__'
   */
  separator?: string;
}

/**
 * Creates a .env file configuration provider
 */
export declare function dotenvProvider(options?: DotenvProviderOptions): ConfigProvider;
