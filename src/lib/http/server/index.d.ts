import type { Router, RouterFactory } from "./router";

type ListenCallback = () => void;

export interface Server extends Router {
  listen: (port: number, callback?: ListenCallback) => void;
}

export declare function server(routerOrFactory?: Router | RouterFactory): Server;

