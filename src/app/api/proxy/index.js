/**
 * @typedef {import('../../../proxy').ProxyService} ProxyService
 * @typedef {import('../../../http/server/router').RouterFactory} RouterFactory
 * @typedef {import('../../config').Config} Config
 */

/**
 * Creates the proxy API router factory
 * @param {Config} config - The application configuration object
 * @returns {RouterFactory} The router factory function to be used in the main API router
 */
const proxyRouter = (config) => {
  const proxyConfig = config.bind("proxy");

  if (!proxyConfig || !proxyConfig.providers) {
    throw new Error("Proxy configuration is missing or invalid");
  }

  const proxyService = createProxyService({
    maxRetries: proxyConfig.maxRetries || 3,
    retryDelay: proxyConfig.retryDelay || 1000,
    timeout: proxyConfig.timeout || 30000,
    rotationStrategy: proxyConfig.rotationStrategy || "round-robin",
    providers: proxyConfig.providers,
  });

  return (router) => {
    router.post("/request", async (req, res) => {
      try {
        const body = await parseBody(req.raw);

        if (!body || typeof body !== "object") {
          res
            .status(400)
            .json({ success: false, error: "Invalid request body" });
          return;
        }

        const { url, method, headers, body: requestBody, geo } = body;

        if (!url) {
          res.status(400).json({ success: false, error: "URL is required" });
          return;
        }

        if (!proxyService.isAllowedUrl(url)) {
          res.status(400).json({
            success: false,
            error: "URL is not allowed (internal or invalid address)",
          });
          return;
        }

        const response = await proxyService.request({
          url,
          method: method || "GET",
          headers: headers || {},
          body: requestBody,
          geo: geo || {},
        });

        res.json({
          success: true,
          status: response.status,
          headers: response.headers,
          body: response.body,
          proxyUsed: {
            id: response.proxyUsed.id,
            country: response.proxyUsed.country,
          },
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        res.status(500).json({
          success: false,
          error: message,
        });
      }
    });

    /**
     * GET /api/proxy/status
     * Get proxy health status
     */
    router.get("/status", async (req, res) => {
      try {
        const status = proxyService.getStatus();
        const healthy = status.filter((s) => s.healthy).length;

        res.json({
          healthy,
          total: status.length,
          proxies: status.map((s) => ({
            id: s.id,
            healthy: s.healthy,
            failures: s.failures,
            countries: s.countries,
          })),
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        res.status(500).json({ success: false, error: message });
      }
    });

    /**
     * POST /api/proxy/test
     * Test proxy connectivity
     */
    router.post("/test", async (req, res) => {
      try {
        const body = await parseBody(req.raw);
        const requestBody = body && typeof body === "object" ? body : {};

        const testUrl = requestBody.url || "https://httpbin.org/ip";
        const geo = requestBody.geo || {};

        if (!proxyService.isAllowedUrl(testUrl)) {
          res.status(400).json({
            success: false,
            error: "URL is not allowed",
          });
          return;
        }

        const response = await proxyService.get(testUrl, { geo });

        res.json({
          success: true,
          testUrl,
          response: {
            status: response.status,
            body: response.body,
          },
          proxyUsed: {
            id: response.proxyUsed.id,
            country: response.proxyUsed.country,
          },
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        res.status(500).json({
          success: false,
          error: message,
        });
      }
    });

    /**
     * POST /api/proxy/reset
     * Reset all proxy failure counters
     */
    router.post("/reset", async (req, res) => {
      try {
        proxyService.reset();
        res.json({ success: true, message: "Proxy failure counters reset" });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        res.status(500).json({ success: false, error: message });
      }
    });
  };
};

module.exports = { proxyRouter };
