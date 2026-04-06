const { parseBody } = require("../../lib/validator");
const {
  hashPassword,
  verifyPassword,
  signToken,
  generateRefreshToken,
  consumeRefreshToken,
} = require("../../lib/auth");
const { authMiddleware } = require("../../middleware/auth");
const { conditionItem } = require("../../lib/query-builder/condition/condition-item");

/**
 * @typedef {import('../context').AppContext} AppContext
 * @typedef {import('../../lib/http/server/router').RouterFactory} RouterFactory
 */

const REGISTER_SCHEMA = {
  email: { type: "string", required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
  password: { type: "string", required: true, minLength: 8 },
};

const LOGIN_SCHEMA = {
  email: { type: "string", required: true },
  password: { type: "string", required: true },
};

const ACCESS_TTL = 15 * 60;        // 15 min
const REFRESH_TTL = 7 * 24 * 3600; // 7 days (for the JWT variant; in-memory store has its own TTL)

/**
 * @param {AppContext} ctx
 * @returns {RouterFactory}
 */
const authRouter = (ctx) => (router) => {
  const secret = ctx.config.getRequired("auth.secret");

  // POST /api/auth/register
  router.post("/register", async (req, res) => {
    const result = await parseBody(req, REGISTER_SCHEMA);
    if (!result.ok) {
      res.setStatus(400).json({ error: result.error.message });
      return;
    }

    const { email, password } = /** @type {{ email: string, password: string }} */ (result.value);

    // Check for existing user
    const { sql: checkSql, params: checkParams } = ctx.qb
      .select("users")
      .where(conditionItem("email").eq(email).build())
      .build();
    const existing = await ctx.db.query(checkSql, checkParams);
    if (existing.rows.length > 0) {
      res.setStatus(409).json({ error: "Email already registered" });
      return;
    }

    const password_hash = await hashPassword(password);
    const { sql, params } = ctx.qb
      .insert("users")
      .set("email", email)
      .set("password_hash", password_hash)
      .returning()
      .build();

    const inserted = await ctx.db.query(sql, params);
    const user = inserted.rows[0];

    res.setStatus(201).json({ id: user.id, email: user.email, role: user.role });
  });

  // POST /api/auth/login
  router.post("/login", async (req, res) => {
    const result = await parseBody(req, LOGIN_SCHEMA);
    if (!result.ok) {
      res.setStatus(400).json({ error: result.error.message });
      return;
    }

    const { email, password } = /** @type {{ email: string, password: string }} */ (result.value);

    const { sql, params } = ctx.qb
      .select("users")
      .where(conditionItem("email").eq(email).build())
      .build();
    const found = await ctx.db.query(sql, params);
    const user = found.rows[0];

    if (!user) {
      res.setStatus(401).json({ error: "Invalid credentials" });
      return;
    }

    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
      res.setStatus(401).json({ error: "Invalid credentials" });
      return;
    }

    const accessToken = signToken({ sub: user.id, role: user.role }, secret, ACCESS_TTL);
    const refreshToken = generateRefreshToken(user.id, user.role);

    res.json({ accessToken, refreshToken });
  });

  // POST /api/auth/refresh
  router.post("/refresh", async (req, res) => {
    const result = await parseBody(req, {
      refreshToken: { type: "string", required: true },
    });
    if (!result.ok) {
      res.setStatus(400).json({ error: result.error.message });
      return;
    }

    const { refreshToken } = /** @type {{ refreshToken: string }} */ (result.value);

    try {
      const { userId, role } = consumeRefreshToken(refreshToken);
      const accessToken = signToken({ sub: userId, role }, secret, ACCESS_TTL);
      const newRefreshToken = generateRefreshToken(userId, role);
      res.json({ accessToken, refreshToken: newRefreshToken });
    } catch (e) {
      res.setStatus(401).json({ error: e.message });
    }
  });

  // Protected routes — middleware applies from here down
  router.use(authMiddleware(secret));

  // GET /api/auth/me
  router.get("/me", async (req, res) => {
    const user = /** @type {any} */ (req).user;
    const { sql, params } = ctx.qb
      .select("users")
      .where(conditionItem("id").eq(user.id).build())
      .build();
    const found = await ctx.db.query(sql, params);
    const row = found.rows[0];
    if (!row) {
      res.setStatus(404).json({ error: "User not found" });
      return;
    }
    res.json({ id: row.id, email: row.email, role: row.role, createdAt: row.created_at });
  });
};

module.exports = { authRouter };
