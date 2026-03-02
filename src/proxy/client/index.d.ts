import type { ProxyInfo, GeoTarget } from "../provider";
import type { Method } from "../../http/request/method";
import type { SocketResponse } from "../../http/socket";

export interface ProxyRequest {
  url: string;
  method?: Method;
  headers?: Record<string, string>;
  body?: string;
  timeout?: number;
  geo?: GeoTarget;
}

export interface ProxyUsed {
  id: string;
  host: string;
  country?: string;
}

export interface ProxyResponse extends SocketResponse {
  proxyUsed: ProxyUsed;
}

export interface ProxyClient {
  request(request: ProxyRequest): Promise<ProxyResponse>;
}

export declare function proxyClient(proxy: ProxyInfo): ProxyClient;
