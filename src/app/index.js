const { router: createRouter } = require("../http/router");
const { apiRouter: creataApiRouter } = require("./api");

/**
 * @typedef {import('../http/router').Router} Router
 * @typedef {import('../config').Config} Config
 */

/**
 * Creates and configures the main application router.
 * @param {Config} config - The application configuration object.
 * @returns {Router} The configured application router.
 */
const appRouter = (config) => {
  const app = createRouter();

  const apiRouter = creataApiRouter(config);

  app.use("/api", apiRouter);

  app.get("/hello", async (req, res) => {
    res.text("Hello, World!");
  });

  return app;
};

module.exports = { appRouter};
