import type { IncomingMessage } from "node:http";
import type { Request } from "../../request";
import { Params } from "./params";

export interface ParseBodyOptions {
  maxSize?: number; // in bytes
}

export interface ServerRequest extends Request {
  getBody(options?: ParseBodyOptions): Promise<Buffer | null>;
  params?: Params;
}

export declare function request(
  incomingMessage: IncomingMessage
): ServerRequest;
