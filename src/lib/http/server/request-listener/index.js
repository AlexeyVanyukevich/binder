/**
 * @typedef {import('node:http').IncomingMessage} IncomingMessage
 * @typedef {import('node:http').ServerResponse} ServerResponse
 * @typedef {import('../route').Route} Route
 * @typedef {import('../middleware').Middleware} Middleware
 * @typedef {import('../router').Router} Router
 * @typedef {import('.').RequestListener} RequestListener
 * @typedef {import('../../request').Request} Request
 * @typedef {import('../../request').Params} Params
 * @typedef {import('../../response').Response} Response
 */

const { request: createRequest } = require('../request');
const { response: createResponse } = require('../response');

/**
 * Creates a request listener function from the provided router.
 * This listener handles routing, middleware execution, and error handling.
 *
 * @param {Router} router - The router instance containing routes and middleware.
 * @returns {RequestListener} A request listener function compatible with Node.js HTTP server.
 */
const requestListener = (router) => {
  /**
   * Handles an incoming HTTP request.
   *
   * @param {IncomingMessage} incomingMessage - The incoming HTTP request object.
   * @param {ServerResponse} serverResponse - The HTTP server response object.
   * @returns {Promise<void>} A promise that resolves when the request has been fully handled.
   */
  const handle = async (incomingMessage, serverResponse) => {
    const request = createRequest(incomingMessage);
    const response = createResponse(serverResponse);

    if (!request.method) {
      response.notFound();
      return;
    }

    await router.handle(request, response);
  };

  return { handle };
};

module.exports = { requestListener };