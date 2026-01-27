const { router: createRouter } = require("../http/router");
const { apiRouter: creataApiRouter } = require("./api");

/**
 * Creates and configures the main application router.
 * @param {ConfigObject} config - The application configuration object.
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
