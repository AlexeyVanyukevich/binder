import { IncomingMessage } from 'node:http';
import { Method } from './method';

export type Params = Record<string, string>;

export interface Request {
  method?: Method;
  url: string;
  params: Params;
}

export declare function request(incomingMessage: IncomingMessage): Request;
