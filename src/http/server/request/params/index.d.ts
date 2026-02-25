export type Params = Record<string, string>;

export interface ParamsMather {
    extract(pathname: string): Params;
    test(pathname: string): boolean;
}

export declare function matcher(routePath: string): ParamsMather