import type { Middleware } from "../../lib/http/server/middleware";

export declare function authMiddleware(secret: string): Middleware;
export declare function requireRole(role: string): Middleware;
