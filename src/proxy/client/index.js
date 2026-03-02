/**
 * @typedef {import('.').ProxyRequest} ProxyRequest
 * @typedef {import('.').ProxyResponse} ProxyResponse
 * @typedef {import('.').ProxyClient} ProxyClient
 * @typedef {import('../provider').ProxyInfo} ProxyInfo
 */

const http = require("node:http");
const tls = require("node:tls");
const { URL } = require("node:url");
const { sendRequest } = require("../../http/socket");
const { Method } = require("../../http/request/method");
const {
  ProxyConnectionError,
  ProxyTimeoutError,
  ProxyAuthError,
} = require("../errors");

const DEFAULT_TIMEOUT = 30000;

/**
 * Creates an HTTP client that routes requests through a proxy
 * @param {ProxyInfo} proxy - The proxy to use
 * @returns {ProxyClient}
 */
const proxyClient = (proxy) => {
  /**
   * Makes an HTTP request through the proxy using CONNECT tunneling
   * @param {ProxyRequest} requestConfig - The request configuration
   * @returns {Promise<ProxyResponse>}
   */
  const request = async (requestConfig) => {
    const {
      url,
      method = Method.GET,
      headers = {},
      body,
      timeout = DEFAULT_TIMEOUT,
    } = requestConfig;
    const targetUrl = new URL(url);
    const isHttps = targetUrl.protocol === "https:";
    const targetPort = parseInt(
      targetUrl.port || (isHttps ? "443" : "80"),
      10,
    );

    return new Promise((resolve, reject) => {
      const proxyAuth = Buffer.from(
        `${proxy.username}:${proxy.password}`,
      ).toString("base64");

      const connectOptions = {
        host: proxy.host,
        port: proxy.port,
        method: "CONNECT",
        path: `${targetUrl.hostname}:${targetPort}`,
        headers: {
          "Proxy-Authorization": `Basic ${proxyAuth}`,
          Host: `${targetUrl.hostname}:${targetPort}`,
        },
        timeout,
      };

      const proxyReq = http.request(connectOptions);

      const timeoutId = setTimeout(() => {
        proxyReq.destroy();
        reject(new ProxyTimeoutError("Proxy connection timed out", proxy.host));
      }, timeout);

      proxyReq.on("connect", (res, socket) => {
        clearTimeout(timeoutId);

        if (res.statusCode === 407) {
          socket.destroy();
          reject(new ProxyAuthError("Proxy authentication failed", proxy.host));
          return;
        }

        if (res.statusCode !== 200) {
          socket.destroy();
          reject(
            new ProxyConnectionError(
              `Proxy connection failed with status ${res.statusCode}`,
              proxy.host,
            ),
          );
          return;
        }

        const requestPath = targetUrl.pathname + targetUrl.search;
        const requestHeaders = {
          ...headers,
          Host: targetUrl.hostname,
        };

        const handleResponse = (response) => {
          resolve({
            ...response,
            proxyUsed: {
              id: proxy.id,
              host: proxy.host,
              country: proxy.countries?.[0],
            },
          });
        };

        if (isHttps) {
          const tlsSocket = tls.connect(
            {
              socket,
              servername: targetUrl.hostname,
              timeout,
            },
            () => {
              sendRequest(tlsSocket, method, requestPath, requestHeaders, body)
                .then(handleResponse)
                .catch(reject);
            },
          );

          tlsSocket.on("error", (err) => {
            reject(
              new ProxyConnectionError(
                `TLS connection failed: ${err.message}`,
                proxy.host,
              ),
            );
          });
        } else {
          sendRequest(socket, method, requestPath, requestHeaders, body)
            .then(handleResponse)
            .catch(reject);
        }
      });

      proxyReq.on("error", (err) => {
        clearTimeout(timeoutId);
        reject(
          new ProxyConnectionError(
            `Proxy connection error: ${err.message}`,
            proxy.host,
          ),
        );
      });

      proxyReq.on("timeout", () => {
        clearTimeout(timeoutId);
        proxyReq.destroy();
        reject(new ProxyTimeoutError("Proxy connection timed out", proxy.host));
      });

      proxyReq.end();
    });
  };

  return { request };
};

module.exports = { proxyClient };
