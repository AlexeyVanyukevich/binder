import { Handler } from "../route";
import { Middleware } from "../middleware";

export interface Router {
  /**
   * Registers a GET route handler for a given path.
   * @param path - The route path.
   * @param handler - The function to handle the GET request.
   */
  get(path: string, handler: Handler): this;

  /**
   * Registers a POST route handler for a given path.
   * @param path - The route path.
   * @param handler - The function to handle the POST request.
   */
  post(path: string, handler: Handler): this;

  /**
   * Registers a PUT route handler for a given path.
   * @param path - The route path.
   * @param handler - The function to handle the POST request.
   */
  put(path: string, handler: Handler): this;

  /**
   * Registers a PATCH route handler for a given path.
   * @param path - The route path.
   * @param handler - The function to handle the POST request.
   */
  patch(path: string, handler: Handler): this;

  /**
   * Registers a DELETE route handler for a given path.
   * @param path - The route path.
   * @param handler - The function to handle the POST request.
   */
  delete(path: string, handler: Handler): this;

  /**
   * Mounts a sub-router on the specified base path.
   * @param basePath - The base path where the sub-router will be mounted.
   * @param router - The router instance to mount.
   */
  use(basePath: string, router: Router): void;

  /**
   * Registers a middleware function to run before route handlers.
   * @param middleware - The middleware function to register.
   */
  use(middleware: Middleware): void;

  handle: Handler;
}


export declare function router(): Router;