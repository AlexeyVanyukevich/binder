/**
 * @typedef {import('.').ClientRequest} ClientRequest
 * @typedef {import('.').ClientResponse} ClientResponse
 * @typedef {import('.').ClientOptions} ClientOptions
 * @typedef {import('.').Client} Client
 * @typedef {import('../request/method').Method} Method
 */

const http = require("node:http");
const https = require("node:https");
const { Method } = require("../request/method");
const { Header } = require("../header");

const DEFAULT_CLIENT_TIMEOUT = 30000;
const HTTPS_PORT = 443;
const HTTP_PORT = 80;

/**
 * Creates an HTTP client for making outgoing requests
 * @param {ClientOptions} [options]
 * @returns {Client}
 */
const client = (options = {}) => {
  const { timeout = DEFAULT_CLIENT_TIMEOUT } = options;

  /**
   * Makes an HTTP request
   * @param {ClientRequest} requestConfig
   * @returns {Promise<ClientResponse>}
   */
  const send = async (requestConfig) => {
    const {
      url,
      method = Method.GET,
      headers = {},
      body,
      timeout: reqTimeout = timeout,
    } = requestConfig;

    const targetUrl = new URL(url);
    const isHttps = targetUrl.protocol === "https:";
    const targetPort = parseInt(targetUrl.port || (isHttps ? HTTPS_PORT : HTTP_PORT), 10);

    return new Promise((resolve, reject) => {
      const protocol = isHttps ? https : http;

      const reqOptions = {
        hostname: targetUrl.hostname,
        port: targetPort,
        path: targetUrl.pathname + targetUrl.search,
        method,
        headers: {
          ...headers,
          [Header.Host]: targetUrl.hostname,
        },
        timeout: reqTimeout,
      };

      const req = protocol.request(reqOptions, (res) => {
        /** @type {Buffer<ArrayBuffer>}  */
        const chunks = [];

        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => {
          resolve({
            status: res.statusCode || 0,
            headers: res.headers,
            body: Buffer.concat(chunks),
          });
        });
      });

      req.on("error", (err) =>
        reject(new Error(`Request error: ${err.message}`)),
      );
      req.on("timeout", () => {
        req.destroy();
        reject(new Error("Request timed out"));
      });

      if (body) {
        req.write(body);
      }
      req.end();
    });
  };

  /**
   * GET request helper
   * @param {string} url
   * @param {Partial<ClientRequest>} [reqOptions]
   * @returns {Promise<ClientResponse>}
   */
  const get = (url, reqOptions = {}) =>
    send({ ...reqOptions, url, method: Method.GET });

  /**
   * POST request helper
   * @param {string} url
   * @param {import('.').RequestContent} content
   * @param {Partial<ClientRequest>} [reqOptions]
   * @returns {Promise<ClientResponse>}
   */
  const post = (url, content, reqOptions = {}) =>
    send({
      ...reqOptions,
      url,
      method: Method.POST,
      body: content.body,
      headers: {
        [Header.ContentType]: content.type,
        ...reqOptions.headers,
      },
    });

  /**
   * PUT request helper
   * @param {string} url
   * @param {import('.').RequestContent} content
   * @param {Partial<ClientRequest>} [reqOptions]
   * @returns {Promise<ClientResponse>}
   */
  const put = (url, content, reqOptions = {}) =>
    send({
      ...reqOptions,
      url,
      method: Method.PUT,
      body: content.body,
      headers: {
        [Header.ContentType]: content.type,
        ...reqOptions.headers,
      },
    });

  /**
   * DELETE request helper
   * @param {string} url
   * @param {Partial<ClientRequest>} [reqOptions]
   * @returns {Promise<ClientResponse>}
   */
  const del = (url, reqOptions = {}) =>
    send({ ...reqOptions, url, method: Method.DELETE });

  return { send, get, post, put, delete: del };
};

module.exports = { client, DEFAULT_CLIENT_TIMEOUT };
