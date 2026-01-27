const http = require("node:http");
const { router: createRouter } = require("./router");
const {
  requestListener: createRequestListener,
} = require("./request-listener");

/**
 * @typedef {import('.').Server} Server
 * @typedef {import('./router').Router} Router
 * @typedef {import('.').ListenCallback} ListenCallback
 */

/**
 * Creates a new HTTP server with a router and request listener.
 * @param {Router} [router] - The router to handle incoming requests.
 * @returns {Server} The server object with a listen method and router functionality.
 */
const server = (router) => {
  if (!router) {
    router = createRouter();
  }
  const requestListener = createRequestListener(router);

  const server = http.createServer(requestListener.handle);

  /**
   * Starts the server and listens on the given port.
   *
   * @param {number} port - The port on which the server will listen.
   * @param {ListenCallback} [callback] - Optional callback invoked when the server starts listening.
   * @returns {void}
   */
  const listen = (port, callback) => {
    server.listen(port, callback);
  };

  return { ...router, listen };
};

module.exports = { server };
