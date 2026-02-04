/**
 * @typedef {import('./method').Method} Method
 * @typedef {import('.').Params} Params
 * @typedef {import('.').Request} Request
 * @typedef {import('node:http').IncomingMessage} IncomingMessage
 * @typedef {import('.').ParseBodyOptions} ParseBodyOptions
 * @typedef {import('node:http').IncomingHttpHeaders} IncomingHttpHeaders
 */

const MAX_BODY_SIZE = 1024 * 1024; // 1MB limit

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
  const url = incomingMessage.url ?? "/";

  /** @type {Params} */
  const params = {};

  /** @type {IncomingMessage} */
  const raw = incomingMessage;

  /** @type {IncomingHttpHeaders} */
  const headers = incomingMessage.headers;

  /**
   * Retrieves and parses the request body.
   * @param {ParseBodyOptions} [options]
   * @returns {Promise<Buffer | null>}
   */
  const getBody = (options) => {
    const { maxSize = MAX_BODY_SIZE } = options || {};

    return new Promise((resolve, reject) => {
      /** @type {Buffer[]} */
      const chunks = [];
      let totalSize = 0;

      incomingMessage.on("data", (chunk) => {
        totalSize += chunk.length;
        if (totalSize > maxSize) {
          incomingMessage.destroy();
          reject(new Error("Request body too large"));
          return;
        }
        chunks.push(chunk);
      });

      incomingMessage.on("end", () => {
        if (chunks.length === 0) {
          resolve(null);
          return;
        }

        resolve(Buffer.concat(chunks));
      });

      incomingMessage.on("error", reject);
    });
  };

  return { method, url, params, headers, raw, getBody };
};


module.exports = { request };
