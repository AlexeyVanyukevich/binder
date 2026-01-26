/**
 * @typedef {import('./method').Method} Method
 * @typedef {import('.').Params} Params
 * @typedef {import('.').Request} Request
 * @typedef {import('node:http').IncomingMessage} IncomingMessage
 */

/**
 * A function to map `IncomingMessage` to a custom `Request` type.
 * @param {IncomingMessage} incomingMessage
 * @returns {Request}
 */
const request = (incomingMessage) => {
  /** @type {Method | undefined} */
  const method = incomingMessage.method
    ? /** @type {Method} */ (incomingMessage.method)
    : undefined;

  /** @type {string} */
  const url = incomingMessage.url ?? '/';

  /** @type {Params} */
  const params = {};

  return { method, url, params };
};

module.exports = { request };