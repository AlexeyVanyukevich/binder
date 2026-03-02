/**
 * @typedef {import('./client').ProxyRequest} ProxyRequest
 * @typedef {import('./client').ProxyResponse} ProxyResponse
 * @typedef {import('./provider').ProxyStatus} ProxyStatus
 * @typedef {import('.').ProxyServiceConfig} ProxyServiceConfig
 * @typedef {import('.').ProxyService} ProxyService
 */

const { proxyClient } = require("./client");
const { proxyProvider, createProxyInfo } = require("./provider");
const { ProxyError, InvalidUrlError } = require("./errors");

const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_RETRY_DELAY = 1000;
const DEFAULT_TIMEOUT = 30000;

/**
 * Validates URL and blocks internal/dangerous addresses
 * @param {string} url - URL to validate
 * @returns {boolean}
 */
const isAllowedUrl = (url) => {
  try {
    const parsed = new URL(url);

    if (!["http:", "https:"].includes(parsed.protocol)) {
      return false;
    }

    const hostname = parsed.hostname.toLowerCase();
    const blockedPatterns = [
      "localhost",
      "127.0.0.1",
      "0.0.0.0",
      "::1",
      "[::1]",
      "metadata.google",
      "169.254.",
    ];

    const blockedPrefixes = [
      "10.",
      "172.16.",
      "172.17.",
      "172.18.",
      "172.19.",
      "172.20.",
      "172.21.",
      "172.22.",
      "172.23.",
      "172.24.",
      "172.25.",
      "172.26.",
      "172.27.",
      "172.28.",
      "172.29.",
      "172.30.",
      "172.31.",
      "192.168.",
    ];

    for (const pattern of blockedPatterns) {
      if (hostname === pattern || hostname.includes(pattern)) {
        return false;
      }
    }

    for (const prefix of blockedPrefixes) {
      if (hostname.startsWith(prefix)) {
        return false;
      }
    }

    return true;
  } catch {
    return false;
  }
};

/**
 * Creates a delay promise
 * @param {number} ms - Milliseconds to wait
 * @returns {Promise<void>}
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Creates the main proxy service with retry and failover logic
 * @param {ProxyServiceConfig} config - Service configuration
 * @returns {ProxyService}
 */
const proxyService = (config) => {
  const {
    maxRetries = DEFAULT_MAX_RETRIES,
    retryDelay = DEFAULT_RETRY_DELAY,
    timeout = DEFAULT_TIMEOUT,
    rotationStrategy = "round-robin",
    providers = {},
  } = config;

  const proxies = Object.entries(providers).map(([id, creds]) =>
    createProxyInfo(id, creds),
  );

  if (proxies.length === 0) {
    throw new Error("No proxy providers configured");
  }

  const provider = proxyProvider({
    proxies,
    strategy: rotationStrategy,
  });

  /**
   * Makes a request with automatic retry on failure
   * @param {ProxyRequest} requestConfig - The request configuration
   * @returns {Promise<ProxyResponse>}
   */
  const request = async (requestConfig) => {
    if (!isAllowedUrl(requestConfig.url)) {
      throw new InvalidUrlError(
        "URL is not allowed (internal or invalid address)",
      );
    }

    let lastError;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const proxy = await provider.getProxy(requestConfig.geo);
        const client = proxyClient(proxy);

        const response = await client.request({
          ...requestConfig,
          timeout: requestConfig.timeout || timeout,
        });

        provider.reportSuccess(proxy.id);
        return response;
      } catch (error) {
        lastError = error;

        if (error instanceof ProxyError && error.proxyHost) {
          const proxyId = proxies.find((p) => p.host === error.proxyHost)?.id;
          if (proxyId) {
            provider.reportFailure(proxyId);
          }
        }

        if (attempt < maxRetries - 1) {
          const delay = retryDelay * Math.pow(2, attempt);
          await sleep(delay);
        }
      }
    }

    throw lastError;
  };

  /**
   * GET request helper
   * @param {string} url
   * @param {Partial<ProxyRequest>} [options]
   * @returns {Promise<ProxyResponse>}
   */
  const get = (url, options = {}) => {
    return request({ ...options, url, method: "GET" });
  };

  /**
   * POST request helper
   * @param {string} url
   * @param {string | object} body
   * @param {Partial<ProxyRequest>} [options]
   * @returns {Promise<ProxyResponse>}
   */
  const post = (url, body, options = {}) => {
    const bodyStr = typeof body === "string" ? body : JSON.stringify(body);
    return request({
      ...options,
      url,
      method: "POST",
      body: bodyStr,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });
  };

  /**
   * Gets status of all proxies
   * @returns {ProxyStatus[]}
   */
  const getStatus = () => provider.getStatus();

  /**
   * Resets all proxy failure counts
   */
  const reset = () => provider.reset();

  return {
    request,
    get,
    post,
    getStatus,
    reset,
    isAllowedUrl,
  };
};

module.exports = {
  proxyService,
  proxyProvider,
  proxyClient,
  createProxyInfo,
  isAllowedUrl,
};
