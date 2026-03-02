export declare class ProxyError extends Error {
  code: string;
  proxyHost: string | null;
  constructor(message: string, code: string, proxyHost?: string | null);
}

export declare class ProxyConnectionError extends ProxyError {
  constructor(message: string, proxyHost?: string);
}

export declare class ProxyTimeoutError extends ProxyError {
  constructor(message: string, proxyHost?: string);
}

export declare class ProxyAuthError extends ProxyError {
  constructor(message: string, proxyHost?: string);
}

export declare class NoHealthyProxyError extends ProxyError {
  constructor();
}

export declare class InvalidUrlError extends ProxyError {
  constructor(message: string);
}
