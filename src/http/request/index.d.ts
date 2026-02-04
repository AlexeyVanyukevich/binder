import { IncomingMessage } from "node:http";
import { Method } from "./method";

export type Params = Record<string, string>;

export interface ParseBodyOptions {
  maxSize?: number; // in bytes
}

export interface Request {
  method?: Method;
  url: string;
  params: Params;
  headers: IncomingMessage["headers"];
  raw: IncomingMessage;
  getBody(options?: ParseBodyOptions): Promise<Buffer | null>;
}

export declare function request(incomingMessage: IncomingMessage): Request;

export declare function parseBody(
  incomingMessage: IncomingMessage,
): Promise<object | string | null>;
