import type { Socket } from "node:net";
import type { TLSSocket } from "node:tls";

export interface SocketResponse {
  status: number;
  headers: Record<string, string | string[]>;
  body: string;
}

export declare function sendRequest(
  socket: Socket | TLSSocket,
  method: string,
  path: string,
  headers: Record<string, string>,
  body?: string,
): Promise<SocketResponse>;

export declare function parseResponse(raw: string): SocketResponse;
