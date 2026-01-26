/**
 * @typedef {import('node:http').IncomingMessage} IncomingMessage
 * @typedef {import('node:http').ServerResponse} ServerResponse
 * @typedef {import('../route')} Route
 * @typedef {import('../middleware')} Middleware
 * @typedef {import('../router').Router} Router
 * @typedef {import('../router').InternalRouter} InternalRouter
 * @typedef {import('.').RequestListener} RequestListener
 * @typedef {import('../request').Request} Request
 * @typedef {import('../request').Params} Params
 * @typedef {import('../response').Response} Response
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
  const routeParameterPattern = ':([a-zA-Z0-9_]+)';

  const routeParametersRegex = new RegExp(routeParameterPattern, 'g');
  /**
   * Prepares an async handler that executes middleware functions sequentially,
   * and finally invokes the matched route handler.
   *
   * @param {Request} request - The request object.
   * @param {Response} response - The response object.
   * @param {Route} route - The matched route containing the handler function.
   * @param {Middleware[]} middlewares - Array of middleware functions to execute before the handler.
   * @returns {() => Promise<void>} An async function that runs the middleware chain and the route handler.
   */
  const run = (request, response, route, middlewares) => {
    let i = 0;

    /**
     * Executes middleware functions sequentially, then calls the route handler.
     *
     * @returns {Promise<void>} Resolves once all middlewares and handler are completed.
     */
    const handler = async () => {
      if (i < middlewares.length) {
        const middleware = middlewares[i++];
        await middleware(request, response, handler);
      } else {
        await route.handler(request, response);
      }
    };

    return handler;
  };

  /**
   * Converts a route path with parameters (e.g., '/users/:id') into a regular expression.
   * @param {string} path - The route path with parameters.
   * @returns {RegExp} The regular expression to match the path.
   */
  const pathToRegex = (path) => {
    const pathWithParams = path.replace(routeParametersRegex, '([^/]+)');
    return new RegExp(`^${pathWithParams}$`);
  };

  /**
   * Extracts parameters from the URL using a given path pattern.
   * @param {string} path - The route path with parameters.
   * @param {string} url - The actual URL to extract parameters from.
   * @returns {Params} An object where keys are parameter names and values are the matched values.
   */
  const extractParams = (path, url) => {
    const paramNames = (path.match(routeParametersRegex) || []).map((param) =>
      param.substring(1)
    );
    const regex = pathToRegex(path);
    const match = url.match(regex);

    if (!match) return {};

    /** @type {Params} */
    const params = {};
    paramNames.forEach((name, index) => {
      params[name] = match[index + 1];
    });
    return params;
  };

  /**
   * Matches an incoming request to a route and executes any applicable middleware and the route handler.
   * If no matching route is found, responds with a 404 Not Found.
   *
   * @param {Request} request - The parsed request object containing method and URL.
   * @param {Response} response - The custom response object with utility methods.
   * @param {InternalRouter} internalRouter - The internal router object with routes and middlewares.
   * @returns {Promise<void>} A promise that resolves after the request has been handled.
   */
  const matchRoute = async (request, response, internalRouter) => {
    const route = internalRouter._routes.find(
      (r) =>
        r.method === request.method && pathToRegex(r.path).test(request.url)
    );

    if (route) {
      request.params = extractParams(route.path, request.url);
      const handler = run(
        request,
        response,
        route,
        internalRouter._middlewares
      );
      try {
        await handler();
      } catch (err) {
        response.internalServerError();
        console.error('Middleware error:', err);
      }
    } else {
      response.notFound();
    }
  };
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

    const internalRouter = /** @type {InternalRouter} */ (router);

    await matchRoute(request, response, internalRouter);
  };

  return { handle };
};

module.exports = { requestListener };