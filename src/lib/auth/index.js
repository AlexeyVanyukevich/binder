const { createHmac, randomBytes, scrypt: scryptFn } = require("node:crypto");
const { promisify } = require("node:util");

const scrypt = promisify(scryptFn);

/**
 * @typedef {import('.').TokenPayload} TokenPayload
 */

const SCRYPT_KEYLEN = 64;

// === Password hashing ===

/**
 * Hashes a password using scrypt.
 * Format: `<salt_hex>:<derived_key_hex>`
 * @param {string} password
 * @returns {Promise<string>}
 */
const hashPassword = async (password) => {
  const salt = randomBytes(16).toString("hex");
  const derived = /** @type {Buffer} */ (await scrypt(password, salt, SCRYPT_KEYLEN));
  return `${salt}:${derived.toString("hex")}`;
};

/**
 * Verifies a password against a stored hash.
 * @param {string} password
 * @param {string} hash
 * @returns {Promise<boolean>}
 */
const verifyPassword = async (password, hash) => {
  const [salt, stored] = hash.split(":");
  const derived = /** @type {Buffer} */ (await scrypt(password, salt, SCRYPT_KEYLEN));
  return derived.toString("hex") === stored;
};

// === JWT (HS256) ===

const HEADER = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");

/**
 * @param {object} payload
 * @param {string} secret
 * @param {number} expiresInSeconds
 * @returns {string}
 */
const signToken = (payload, secret, expiresInSeconds) => {
  const now = Math.floor(Date.now() / 1000);
  const full = { ...payload, iat: now, exp: now + expiresInSeconds };
  const body = Buffer.from(JSON.stringify(full)).toString("base64url");
  const data = `${HEADER}.${body}`;
  const sig = createHmac("sha256", secret).update(data).digest("base64url");
  return `${data}.${sig}`;
};

/**
 * Verifies a JWT and returns its payload.
 * Throws if invalid or expired.
 * @param {string} token
 * @param {string} secret
 * @returns {TokenPayload}
 */
const verifyToken = (token, secret) => {
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("Invalid token format");
  const [header, body, sig] = parts;
  const data = `${header}.${body}`;
  const expected = createHmac("sha256", secret).update(data).digest("base64url");
  if (sig !== expected) throw new Error("Invalid token signature");
  const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp && payload.exp < now) throw new Error("Token expired");
  return payload;
};

// === Refresh tokens (in-memory, MVP) ===

/** @type {Map<string, { userId: string, role: string, expiresAt: number }>} */
const refreshStore = new Map();

const REFRESH_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

/**
 * Generates and stores a refresh token.
 * @param {string} userId
 * @param {string} role
 * @returns {string}
 */
const generateRefreshToken = (userId, role) => {
  const token = randomBytes(32).toString("hex");
  const expiresAt = Math.floor(Date.now() / 1000) + REFRESH_TTL_SECONDS;
  refreshStore.set(token, { userId, role, expiresAt });
  return token;
};

/**
 * Validates a refresh token and returns its data, then removes it (rotation).
 * @param {string} token
 * @returns {{ userId: string, role: string }}
 */
const consumeRefreshToken = (token) => {
  const entry = refreshStore.get(token);
  if (!entry) throw new Error("Invalid refresh token");
  const now = Math.floor(Date.now() / 1000);
  if (entry.expiresAt < now) {
    refreshStore.delete(token);
    throw new Error("Refresh token expired");
  }
  refreshStore.delete(token);
  return { userId: entry.userId, role: entry.role };
};

module.exports = {
  hashPassword,
  verifyPassword,
  signToken,
  verifyToken,
  generateRefreshToken,
  consumeRefreshToken,
};
