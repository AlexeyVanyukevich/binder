const MAX_BODY_SIZE = 1024 * 1024; // 1MB limit

/**
 * @typedef {import('.').ParseBodyOptions} ParseBodyOptions
 * @typedef {import('.').ServerRequest} ServerRequest
 * @typedef {import('node:http').IncomingMessage} IncomingMessage
 */

/**
 * @param {IncomingMessage} incomingMessage
 * @returns {ServerRequest}
 */
const request = (incomingMessage) => {
  const url = new URL(incomingMessage.url ?? "/");
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

  const result = {
    getBody,
    get method() {
      return incomingMessage.method;
    },
    get url() {
      return url;
    },
    get headers() {
      return incomingMessage.headers;
    },
  };

  return result;
};

module.exports = { request };
