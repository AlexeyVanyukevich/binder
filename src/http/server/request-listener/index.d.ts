import type { IncomingMessage, ServerResponse } from "node:http";
import type { Router } from "../router";

export interface RequestListener {
  handle: (
    incomingMessage: IncomingMessage,
    serverResponse: ServerResponse
  ) => Promise<void> | void;
}

export declare function requestListener(router: Router): RequestListener;
