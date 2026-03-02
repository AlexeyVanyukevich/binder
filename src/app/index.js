const { apiRouter } = require("./api");

/**
 * @typedef {import('../http/server/router').Router} Router
 * @typedef {import('../http/server/router').RouterFactory} RouterFactory
 * @typedef {import('../config').Config} Config
 */

/**
 * Creates and configures the main application router.
 * @param {Config} config - The application configuration object.
 * @returns {RouterFactory} The configured application router.
 */
const appRouter = (config) => {

  const apiRouterFactory = apiRouter(config);

  return router => {

  router.use("/api", apiRouterFactory);

  router.get("/hello", async (req, res) => {
    res.text("Hello, World!");
  });
  };
};

module.exports = { appRouter};
