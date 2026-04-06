const { verifyToken } = require("../../lib/auth");

/**
 * @typedef {import('../../lib/http/server/request').ServerRequest} ServerRequest
 * @typedef {import('../../lib/http/server/response').ServerResponse} ServerResponse
 */

/**
 * Creates JWT auth middleware.
 * Reads `Authorization: Bearer <token>`, verifies it, and attaches
 * `req.user = { id, role }` to the request. Returns 401 on failure.
 * @param {string} secret - JWT secret
 * @returns {import('../../lib/http/server/router').Middleware}
 */
const authMiddleware = (secret) => async (req, res, next) => {
  const authHeader = /** @type {string | undefined} */ (req.headers["authorization"]);
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.setStatus(401).json({ error: "Unauthorized" });
    return;
  }

  const token = authHeader.slice(7);
  try {
    const payload = verifyToken(token, secret);
    /** @type {any} */ (req).user = { id: payload.sub, role: payload.role };
    await next?.();
  } catch {
    res.setStatus(401).json({ error: "Unauthorized" });
  }
};

/**
 * Middleware factory that requires a specific role.
 * Must be used after `authMiddleware`.
 * @param {string} role
 * @returns {import('../../lib/http/server/router').Middleware}
 */
const requireRole = (role) => async (req, res, next) => {
  const user = /** @type {any} */ (req).user;
  if (!user || user.role !== role) {
    res.setStatus(403).json({ error: "Forbidden" });
    return;
  }
  await next?.();
};

module.exports = { authMiddleware, requireRole };
