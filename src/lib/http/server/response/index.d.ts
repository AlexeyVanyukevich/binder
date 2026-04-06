import type { Response } from "../../response";
import type { StatusCode } from "../../response/status-code";
import type { ServerResponse as NodeServerResponse } from "node:http";

export interface ServerResponse extends Response {
  ok: () => void;
  html: (html: string) => void;
  text: (text: string) => void;
  json: (json: object | string) => void;
  send: (body?: any) => void;
  setStatus: (status: StatusCode) => void;
  blob: (body: Buffer) => void;
  notFound: () => void;
  internalServerError(): void;
}

export declare function response(
  outgoingMessage: NodeServerResponse
): ServerResponse;
