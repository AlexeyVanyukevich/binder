/**
 * @typedef {import('.').Router} Router
 * @typedef {import('.').RouterFactory} RouterFactory
 * @typedef {import('../middleware').Middleware} Middleware
 * @typedef {import('../route').Handler} RouteHandler
 * @typedef {import('../../request/method').Method} Method
 * @typedef {import('../request').ServerRequest} Request
 * @typedef {import('../response').ServerResponse} Response
 */

const { matcher } = require("../request/params");

/**
 * Creates and returns a new Router instance.
 * Routes, middleware, and sub-routers are stored in a single queue
 * and processed in registration order. The first matching route wins.
 * @returns {Router}
 */
const router = (prefix = "") => {
  /** @type {Middleware[]} */
  const queue = [];

  /**
   * Registers a route handler for a specific HTTP method and path pattern.
   * @param {Method} method - The HTTP method (e.g., GET, POST).
   * @param {string} path - The route path pattern (e.g., "/users/:id").
   * @param {RouteHandler} handler - The function to handle requests matching the method and path.
   */
  const addRoute = (method, path, handler) => {
    const { test, extract } = matcher(prefix + path);

    queue.push(async (request, response, next) => {
      const pathname = request.url.pathname;

      if (method === request.method && test(pathname)) {
        request.params = extract(pathname);
        await handler(request, response);
      } else {
        await next?.();
      }
    });
  };

  /** @param {string} path @param {RouteHandler} handler */
  const get = (path, handler) => addRoute("GET", path, handler);

  /** @param {string} path @param {RouteHandler} handler */
  const post = (path, handler) => addRoute("POST", path, handler);

  /** @param {string} path @param {RouteHandler} handler */
  const put = (path, handler) => addRoute("PUT", path, handler);

  /** @param {string} path @param {RouteHandler} handler */
  const patch = (path, handler) => addRoute("PATCH", path, handler);

  /** @param {string} path @param {RouteHandler} handler */
  const deleteRoute = (path, handler) => addRoute("DELETE", path, handler);

  /**
  @param {Middleware} handler */
  const addMiddleware = (handler) => {
    queue.push(handler);
  };

  /**
   * Registers a sub-router at a given base path.
   * Requests with matching base paths are delegated to the sub-router.
   * @param {string} basePath - The base path for the sub-router.
   * @param {Router} router - The sub-router instance to mount.
   */
  const addRouter = (basePath, router) => {
    queue.push(async (request, response, next) => {
      const pathname = request.url.pathname;
      if (pathname.startsWith(prefix + basePath)) {
        await router.handle(request, response);
      } else {
        await next?.();
      }
    });
  };

  /**
   * Registers a middleware or mounts a sub-router.
   * @param {string | Middleware} firstArg - Base path or middleware function.
   * @param {Router | RouterFactory} [routerOrFactory] - Optional router instance or factory function to mount if the first argument is a base path.
   */
  const use = (firstArg, routerOrFactory) => {
    if (typeof firstArg === "string" && routerOrFactory) {
      const subRouter = router(prefix + firstArg);
      if (typeof routerOrFactory === "function") {
        routerOrFactory(subRouter);
      }
      addRouter(firstArg, subRouter);
    } else if (typeof firstArg === "function") {
      addMiddleware(firstArg);
    }
  };

  /**
   * Walks the queue in registration order.
   * Middleware executes and calls next to continue.
   * The first matching route handles the request.
   * Sub-routers are delegated to if the base path matches.
   *
   * @param {Request} request
   * @param {Response} response
   * @returns {Promise<void>}
   */
  const handle = async (request, response) => {
    let index = 0;

    const next = async () => {
      if (index >= queue.length) {
        response.notFound();
        return;
      }

      const entry = queue[index++];

      await entry(request, response, next);
    };

    try {
      await next();
    } catch (err) {
      response.internalServerError();
      console.error("Router error:", err);
    }
  };

  return { get, post, put, patch, delete: deleteRoute, use, handle };
};

module.exports = { router };
