import { Router } from "./router";

export interface Server extends Router {
  listen: (port: number) => void;
}

export declare function server(router?: Router): Server;
