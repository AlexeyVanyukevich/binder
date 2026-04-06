import { ServerRequest } from '../request';
import { Method } from '../../request/method';
import { ServerResponse } from '../response';

export type Handler = (request: ServerRequest, response: ServerResponse) => Promise<void> | void;

export interface Route {
  method: Method;
  path: string;
  handler: Handler;
}
