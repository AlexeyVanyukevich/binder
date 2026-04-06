const { authRouter } = require("./auth");
const { authMiddleware } = require("../../middleware/auth");

/**
 * @typedef {import('../context').AppContext} AppContext
 * @typedef {import('../../lib/http/server/router').RouterFactory} RouterFactory
 */

/**
 * @param {AppContext} ctx
 * @returns {RouterFactory}
 */
const apiRouter = (ctx) => (router) => {
  const secret = ctx.config.getRequired("auth.secret");

  // Public + protected auth routes (middleware is applied inside authRouter)
  router.use("/auth", authRouter(ctx));

  // Auth middleware applies to all routes registered after this point
  router.use(authMiddleware(secret));

  router.get("/hello", async (req, res) => {
    res.json({ message: "Hello, World!" });
  });
};

module.exports = { apiRouter };
