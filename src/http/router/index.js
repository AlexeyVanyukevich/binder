/**
 * @typedef {import('.').Router} Router
 * @typedef {import('.').InternalRouter} InternalRouter
 * @typedef {import('../middleware')} Middleware
 * @typedef {import('../middleware').Handler} NextHandler
 * @typedef {import('../route')} Route
 * @typedef {import('../route').Handler} RouteHandler
 * @typedef {import('../request').Method} Method
 * @typedef {import('../request').Request} Request
 * @typedef {import('../response').Response} Response
 */

/**
 * Creates and returns a new Router instance.
 * @returns {Router} A new router object with methods for defining routes and middleware.
 */
const router = () => {
  /** @type {Route[]} Stores all registered routes */
  const routes = [];

  /** @type {Middleware[]} Stores all registered middleware functions */
  const middlewares = [];

  /**
   * Adds a new route to the router.
   * @param {Method} method - The HTTP method (e.g., 'GET', 'POST').
   * @param {string} path - The route path.
   * @param {RouteHandler} handler - The function to handle the request.
   */
  const addRoute = (method, path, handler) => {
    routes.push({ method, path, handler });
  };

  /**
   * Registers a GET route.
   * @param {string} path - The route path.
   * @param {RouteHandler} handler - The function to handle GET requests.
   */
  const get = (path, handler) => {
    addRoute('GET', path, handler);
  };

  /**
   * Registers a POST route.
   * @param {string} path - The route path.
   * @param {RouteHandler} handler - The function to handle POST requests.
   */
  const post = (path, handler) => {
    addRoute('POST', path, handler);
  };

  /**
   * Registers a PUT route.
   * @param {string} path - The route path.
   * @param {RouteHandler} handler - The function to handle POST requests.
   */
  const put = (path, handler) => {
    addRoute('POST', path, handler);
  };

  /**
   * Registers a PATCH route.
   * @param {string} path - The route path.
   * @param {RouteHandler} handler - The function to handle POST requests.
   */
  const patch = (path, handler) => {
    addRoute('POST', path, handler);
  };

  /**
   * Registers a DELETE route.
   * @param {string} path - The route path.
   * @param {RouteHandler} handler - The function to handle POST requests.
   */
  const deleteRoute = (path, handler) => {
    addRoute('DELETE', path, handler);
  };

  /**
   * Creates a middleware wrapper.
   * @param {string} basePath - The base path under which the sub-router will be mounted.
   * @param {Middleware} middleware - The middleware function to wrap.
   * @returns {Middleware} A new wrapped middleware function.
   */

  const createMiddlewareWrapper = (basePath, middleware) => {
    /**
     * The wrapped middleware function.
     * @param {Request} request - The HTTP request object.
     * @param {Response} response - The HTTP response object.
     * @param {NextHandler} next - The next middleware handler function.
     */
    const wrappedMw = async (request, response, next) => {
      if (request.url.startsWith(basePath)) {
        await middleware(request, response, next);
      } else {
        await next();
      }
    };

    return wrappedMw;
  };

  /**
   * Mounts another router under a base path and includes its routes and middlewares.
   * @param {string} basePath - The base path under which the sub-router will be mounted.
   * @param {Router} router - The router to be mounted.
   */
  const useRouter = (basePath, router) => {
    const internalRouter = /** @type {InternalRouter} */ (router);
    const childRoutes = internalRouter._routes || [];
    childRoutes.forEach(({ method, path, handler }) => {
      addRoute(method, `${basePath}${path}`, handler);
    });

    const childMiddlewares = internalRouter._middlewares || [];
    childMiddlewares.forEach((middleware) => {
      const wrappedMw = createMiddlewareWrapper(basePath, middleware);
      middlewares.push(wrappedMw);
    });
  };

  /**
   * Adds a middleware function to the router.
   * @param {Middleware} middleware - The middleware function to register.
   */
  const useMiddleware = (middleware) => {
    middlewares.push(middleware);
  };

  /**
   * Registers either a middleware or a sub-router depending on the arguments.
   * @param {string | Middleware} firstArg - Base path or middleware.
   * @param {Router} [router] - Optional router instance, required if firstArg is a string.
   */
  const use = (firstArg, router) => {
    if (typeof firstArg === 'string' && router) {
      useRouter(firstArg, router);
    } else if (typeof firstArg === 'function') {
      useMiddleware(firstArg);
    }
  };

  /**
   * The router instance that exposes methods.
   * @type {InternalRouter}
   */
  const router = {
    get,
    post,
    put,
    patch,
    delete: deleteRoute,
    use,
    _middlewares: middlewares,
    _routes: routes
  };

  return router;
};

module.exports = { router };