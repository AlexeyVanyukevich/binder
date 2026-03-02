/**
 * Base error class for proxy-related errors
 */
class ProxyError extends Error {
  /**
   * @param {string} message - Error message
   * @param {string} code - Error code
   * @param {string | null} [proxyHost] - Host of the proxy that failed
   */
  constructor(message, code, proxyHost = null) {
    super(message);
    this.name = "ProxyError";
    this.code = code;
    this.proxyHost = proxyHost;
  }
}

/**
 * Error thrown when proxy connection fails
 */
class ProxyConnectionError extends ProxyError {
  /**
   * @param {string} message - Error message
   * @param {string} [proxyHost] - Host of the proxy that failed
   */
  constructor(message, proxyHost) {
    super(message, "PROXY_CONNECTION_FAILED", proxyHost);
    this.name = "ProxyConnectionError";
  }
}

/**
 * Error thrown when proxy request times out
 */
class ProxyTimeoutError extends ProxyError {
  /**
   * @param {string} message - Error message
   * @param {string} [proxyHost] - Host of the proxy that failed
   */
  constructor(message, proxyHost) {
    super(message, "PROXY_TIMEOUT", proxyHost);
    this.name = "ProxyTimeoutError";
  }
}

/**
 * Error thrown when proxy authentication fails
 */
class ProxyAuthError extends ProxyError {
  /**
   * @param {string} message - Error message
   * @param {string} [proxyHost] - Host of the proxy that failed
   */
  constructor(message, proxyHost) {
    super(message, "PROXY_AUTH_FAILED", proxyHost);
    this.name = "ProxyAuthError";
  }
}

/**
 * Error thrown when no healthy proxies are available
 */
class NoHealthyProxyError extends ProxyError {
  constructor() {
    super("No healthy proxies available", "NO_HEALTHY_PROXY");
    this.name = "NoHealthyProxyError";
  }
}

/**
 * Error thrown when target URL is invalid or blocked
 */
class InvalidUrlError extends ProxyError {
  /**
   * @param {string} message - Error message
   */
  constructor(message) {
    super(message, "INVALID_URL");
    this.name = "InvalidUrlError";
  }
}

module.exports = {
  ProxyError,
  ProxyConnectionError,
  ProxyTimeoutError,
  ProxyAuthError,
  NoHealthyProxyError,
  InvalidUrlError,
};
