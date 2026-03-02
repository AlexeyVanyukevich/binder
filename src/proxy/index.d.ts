import type { ProxyRequest, ProxyResponse, ProxyClient } from "./client";
import type { ProxyProvider, ProxyStatus, ProxyInfo, GeoTarget } from "./provider";

export interface ProxyServiceConfig {
  maxRetries?: number;
  retryDelay?: number;
  timeout?: number;
  rotationStrategy?: "round-robin" | "random";
  providers: Record<string, Record<string, string>>;
}

export interface ProxyService {
  request(request: ProxyRequest): Promise<ProxyResponse>;
  get(url: string, options?: Partial<ProxyRequest>): Promise<ProxyResponse>;
  post(
    url: string,
    body: string | object,
    options?: Partial<ProxyRequest>,
  ): Promise<ProxyResponse>;
  getStatus(): ProxyStatus[];
  reset(): void;
  isAllowedUrl(url: string): boolean;
}

export declare function proxyService(config: ProxyServiceConfig): ProxyService;
export declare function isAllowedUrl(url: string): boolean;

export type {
  ProxyRequest,
  ProxyResponse,
  ProxyClient,
  ProxyProvider,
  ProxyStatus,
  ProxyInfo,
  GeoTarget,
};

export { proxyProvider, proxyClient, createProxyInfo } from "./provider";
