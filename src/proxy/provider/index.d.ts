export interface ProxyInfo {
  id: string;
  host: string;
  port: number;
  username: string;
  password: string;
  protocol: "http" | "https";
  countries?: string[];
  zone?: string;
}

export interface GeoTarget {
  country?: string;
  city?: string;
  state?: string;
}

export interface ProxyProviderConfig {
  proxies: ProxyInfo[];
  strategy?: "round-robin" | "random";
}

export interface ProxyStatus {
  id: string;
  host: string;
  countries: string[];
  healthy: boolean;
  failures: number;
}

export interface ProxyProvider {
  getProxy(geo?: GeoTarget): Promise<ProxyInfo>;
  reportFailure(proxyId: string): void;
  reportSuccess(proxyId: string): void;
  getStatus(): ProxyStatus[];
  reset(): void;
}

export declare function proxyProvider(config: ProxyProviderConfig): ProxyProvider;
export declare function createProxyInfo(
  providerId: string,
  credentials: Record<string, string>,
): ProxyInfo;
