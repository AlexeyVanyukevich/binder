const { router: createRouter } = require("../../http/router");

/**
 * @typedef {import('../../http/router').Router} Router
 * @typedef {import('../../config').Config} Config
 */


/**
 * Creates and configures the API router.
 * @param {Config} config - The application configuration object.
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
