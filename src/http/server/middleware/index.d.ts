import type { Handler as RouteHandler } from '../route';

export type Handler = () => Promise<void> | void | undefined;

export type Middleware = (
  ...args: [...Parameters<RouteHandler>, next: Handler]
) => ReturnType<RouteHandler>;
