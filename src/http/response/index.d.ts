import { ServerResponse } from 'node:http';
import { StatusCode } from './status-code';

export interface Response {
    ok: () => void;
    html: (html: string) => void;
    text: (text: string) => void;
    json: (json: object | string) => void;
    send: (body?: any) => void;
    status: (status: StatusCode) => Response;
    blob: (body: Buffer) => void;
    sendStatus: (status: StatusCode) => void;
    notFound: () => void;
    internalServerError(): void;
  }

export declare function response(serverResponse: ServerResponse): Response;
