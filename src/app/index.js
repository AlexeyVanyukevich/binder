const { apiRouter } = require("./api");

/**
 * @typedef {import('./context').AppContext} AppContext
 * @typedef {import('../lib/http/server/router').RouterFactory} RouterFactory
 */

/**
 * Creates and configures the main application router.
 * @param {AppContext} ctx
 * @returns {RouterFactory}
 */
const appRouter = (ctx) => (router) => {
  router.use("/api", apiRouter(ctx));

  router.get("/hello", async (req, res) => {
    res.text("Hello, World!");
  });
};

module.exports = { appRouter };
