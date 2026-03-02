
/**
 * @typedef {import('../../http/server/router').Router} Router
 * @typedef {import('../../http/server/router').RouterFactory} RouterFactory
 * @typedef {import('../../config').Config} Config
 */

/**
 * Creates and configures the API router.
 * @param {Config} config - The application configuration object.
 * @returns {RouterFactory} The configured API router.
 */
const apiRouter = (config) => {  
  return (router) => {
    router.get("/hello", async (req, res) => {
      res.text("Hello, World! from API");
    });
  };
};

module.exports = { apiRouter };
