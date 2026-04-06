export interface TokenPayload {
  sub: string;
  role: string;
  iat: number;
  exp: number;
}

export declare function hashPassword(password: string): Promise<string>;
export declare function verifyPassword(
  password: string,
  hash: string
): Promise<boolean>;

export declare function signToken(
  payload: object,
  secret: string,
  expiresInSeconds: number
): string;

export declare function verifyToken(
  token: string,
  secret: string
): TokenPayload;

export declare function generateRefreshToken(
  userId: string,
  role: string
): string;

export declare function consumeRefreshToken(token: string): {
  userId: string;
  role: string;
};
