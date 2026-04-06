import type { ServerRequest } from "../http/server/request";
import type { Result } from "../../result";

export interface ValidationField {
  type?: "string" | "number" | "boolean";
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
}

export type ValidationSchema = Record<string, ValidationField>;

export declare function validate<T = Record<string, unknown>>(
  body: Record<string, unknown>,
  schema: ValidationSchema
): Result<T>;

export declare function parseBody<T = Record<string, unknown>>(
  req: ServerRequest,
  schema: ValidationSchema
): Promise<Result<T>>;
