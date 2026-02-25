import { SetupSchema } from "../../config/setup";

export interface AppConfig {
  port: number;
}

export declare const appConfigSchema: SetupSchema<AppConfig>;