const { ok, err } = require("../../result");

/**
 * @typedef {import('.').ValidationSchema} ValidationSchema
 * @typedef {import('.').ValidationField} ValidationField
 * @typedef {import('../../result').Result} Result
 */

/**
 * Validates a body object against a schema.
 * @template T
 * @param {Record<string, unknown>} body
 * @param {ValidationSchema} schema
 * @returns {import('../../result').Result<T>}
 */
const validate = (body, schema) => {
  const errors = [];

  for (const [field, rules] of Object.entries(schema)) {
    const value = body[field];

    if (rules.required && (value === undefined || value === null || value === "")) {
      errors.push(`${field}: required`);
      continue;
    }

    if (value === undefined || value === null) continue;

    if (rules.type && typeof value !== rules.type) {
      errors.push(`${field}: must be ${rules.type}`);
      continue;
    }

    if (rules.minLength !== undefined && typeof value === "string" && value.length < rules.minLength) {
      errors.push(`${field}: minimum length is ${rules.minLength}`);
    }

    if (rules.maxLength !== undefined && typeof value === "string" && value.length > rules.maxLength) {
      errors.push(`${field}: maximum length is ${rules.maxLength}`);
    }

    if (rules.pattern && typeof value === "string" && !rules.pattern.test(value)) {
      errors.push(`${field}: invalid format`);
    }

    if (rules.min !== undefined && typeof value === "number" && value < rules.min) {
      errors.push(`${field}: minimum value is ${rules.min}`);
    }

    if (rules.max !== undefined && typeof value === "number" && value > rules.max) {
      errors.push(`${field}: maximum value is ${rules.max}`);
    }
  }

  if (errors.length > 0) {
    return err(errors.join("; "));
  }

  return ok(/** @type {T} */ (body));
};

/**
 * Reads request body, JSON-parses it, and validates against schema.
 * @template T
 * @param {import('../../lib/http/server/request').ServerRequest} req
 * @param {ValidationSchema} schema
 * @returns {Promise<import('../../result').Result<T>>}
 */
const parseBody = async (req, schema) => {
  const buf = await req.getBody();
  if (!buf) return err("Request body is empty");

  let body;
  try {
    body = JSON.parse(buf.toString("utf8"));
  } catch {
    return err("Invalid JSON");
  }

  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return err("Body must be a JSON object");
  }

  return validate(body, schema);
};

module.exports = { validate, parseBody };
