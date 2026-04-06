import type { Response } from '../response';
import type { Request } from '../request';
import type { ContentType } from '../content-type';

export type RequestBody = string | Buffer;

export interface RequestContent {
  body: RequestBody;
  type: ContentType;
}

export interface ClientRequest extends Request {
  body?: RequestBody;
}

export interface ClientResponse extends Omit<Response, 'body'> {
  body: Buffer;
}

export interface ClientOptions {
  timeout?: number;
}

export interface Client {
  send(request: ClientRequest): Promise<ClientResponse>;
  get(url: string, options?: Partial<ClientRequest>): Promise<ClientResponse>;
  post(
    url: string,
    content: RequestContent,
    options?: Partial<ClientRequest>,
  ): Promise<ClientResponse>;
  put(
    url: string,
    content: RequestContent,
    options?: Partial<ClientRequest>,
  ): Promise<ClientResponse>;
  delete(url: string, options?: Partial<ClientRequest>): Promise<ClientResponse>;
}

export declare function client(options?: ClientOptions): Client;

export declare const DEFAULT_CLIENT_TIMEOUT: number;