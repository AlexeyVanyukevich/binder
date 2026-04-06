import { ConfigProvider } from '..';

/**
 * Options for the JSON provider
 */
export interface JsonProviderOptions {
  /**
   * Path to the JSON file
   */
  path: string;

  /**
   * Don't throw if file doesn't exist
   * @default false
   */
  optional?: boolean;

  /**
   * File encoding
   * @default 'utf-8'
   */
  encoding?: BufferEncoding;
}

/**
 * Creates a JSON file configuration provider
 */
export declare function jsonProvider(options: JsonProviderOptions): ConfigProvider;
