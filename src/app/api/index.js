const { router: createRouter } = require("../../http/router");

/**
 * Creates and configures the API router.
 * @param {ConfigObject} config - The application configuration object.
 * @returns {Router} The configured API router.
 */
const apiRouter = (config) => {
  const router = createRouter();

  router.get("/hello", async (req, res) => {
    res.text("Hello, World! from API");
  });

  return router;
};

module.exports = { apiRouter };
