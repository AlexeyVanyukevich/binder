import { Headers } from '../header';
import { StatusCode } from './status-code';

export interface Response {
  status: StatusCode;
  headers: Headers;
  body: string;
}