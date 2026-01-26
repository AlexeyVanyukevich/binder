import { Request } from '../request';
import { Method } from '../request/method';
import { Response } from '../response';

export type Handler = (request: Request, response: Response) => Promise<void> | void;

export interface Route {
  method: Method;
  path: string;
  handler: Handler;
}
