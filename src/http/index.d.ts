import { Router } from "./router";

type ListenCallback = () => void;

export interface Server extends Router {
  listen: (port: number, callback?: ListenCallback) => void;
}

export declare function server(router?: Router): Server;
