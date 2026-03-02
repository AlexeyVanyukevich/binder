/**
 * @typedef {import('.').ProxyInfo} ProxyInfo
 * @typedef {import('.').ProxyProvider} ProxyProvider
 * @typedef {import('.').ProxyProviderConfig} ProxyProviderConfig
 * @typedef {import('.').GeoTarget} GeoTarget
 * @typedef {import('.').ProxyStatus} ProxyStatus
 */

const { NoHealthyProxyError } = require("../errors");

const MAX_FAILURES = 5;
const FAILURE_COOLDOWN_MS = 60000;

/**
 * Creates a proxy provider with rotation and circuit breaker support
 * @param {ProxyProviderConfig} config - Provider configuration
 * @returns {ProxyProvider}
 */
const proxyProvider = (config) => {
  const { proxies, strategy = "round-robin" } = config;

  let currentIndex = 0;
  /** @type {Map<string, { count: number, lastFailure: number }>} */
  const failureCount = new Map();

  /**
   * Gets list of healthy proxies (excludes temporarily failed ones)
   * @returns {ProxyInfo[]}
   */
  const getHealthyProxies = () => {
    const now = Date.now();
    return proxies.filter((proxy) => {
      const failure = failureCount.get(proxy.id);
      if (!failure) return true;
      if (
        failure.count >= MAX_FAILURES &&
        now - failure.lastFailure < FAILURE_COOLDOWN_MS
      ) {
        return false;
      }
      if (now - failure.lastFailure >= FAILURE_COOLDOWN_MS) {
        failureCount.delete(proxy.id);
        return true;
      }
      return true;
    });
  };

  /**
   * Selects a proxy using the configured strategy
   * @param {GeoTarget} [geo] - Geo-targeting options
   * @returns {Promise<ProxyInfo>}
   */
  const getProxy = async (geo) => {
    let candidates = getHealthyProxies();

    if (geo?.country) {
      const country = geo.country.toLowerCase();
      const geoFiltered = candidates.filter((p) =>
        p.countries?.some((c) => c.toLowerCase() === country),
      );
      if (geoFiltered.length > 0) {
        candidates = geoFiltered;
      }
    }

    if (candidates.length === 0) {
      throw new NoHealthyProxyError();
    }

    /** @type {ProxyInfo} */
    let selected;

    switch (strategy) {
      case "random":
        selected = candidates[Math.floor(Math.random() * candidates.length)];
        break;
      case "round-robin":
      default:
        currentIndex = currentIndex % candidates.length;
        selected = candidates[currentIndex];
        currentIndex++;
        break;
    }

    return selected;
  };

  /**
   * Reports a proxy failure for circuit breaker logic
   * @param {string} proxyId - The proxy identifier
   */
  const reportFailure = (proxyId) => {
    const existing = failureCount.get(proxyId) || { count: 0, lastFailure: 0 };
    failureCount.set(proxyId, {
      count: existing.count + 1,
      lastFailure: Date.now(),
    });
  };

  /**
   * Reports a proxy success (resets failure count)
   * @param {string} proxyId - The proxy identifier
   */
  const reportSuccess = (proxyId) => {
    failureCount.delete(proxyId);
  };

  /**
   * Gets current status of all proxies
   * @returns {ProxyStatus[]}
   */
  const getStatus = () => {
    const healthyProxies = getHealthyProxies();
    return proxies.map((proxy) => ({
      id: proxy.id,
      host: proxy.host,
      countries: proxy.countries || [],
      healthy: healthyProxies.some((p) => p.id === proxy.id),
      failures: failureCount.get(proxy.id)?.count || 0,
    }));
  };

  /**
   * Resets all failure counts
   */
  const reset = () => {
    failureCount.clear();
    currentIndex = 0;
  };

  return {
    getProxy,
    reportFailure,
    reportSuccess,
    getStatus,
    reset,
  };
};

/**
 * Creates proxy info from provider credentials
 * @param {string} providerId - Provider identifier
 * @param {Record<string, string>} credentials - Provider credentials from config
 * @returns {ProxyInfo}
 */
const createProxyInfo = (providerId, credentials) => {
  return {
    id: providerId,
    host: credentials.host,
    port: parseInt(credentials.port, 10),
    username: credentials.username,
    password: credentials.password,
    protocol: /** @type {'http' | 'https'} */ (credentials.protocol || "http"),
    countries: credentials.countries
      ? credentials.countries.split(",").map((c) => c.trim().toLowerCase())
      : [],
    zone: credentials.zone,
  };
};

module.exports = { proxyProvider, createProxyInfo };
