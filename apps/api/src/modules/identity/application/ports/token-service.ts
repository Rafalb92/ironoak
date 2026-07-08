export const TOKEN_SERVICE = Symbol('TOKEN_SERVICE');

// co realnie niesie token — tożsamość, nic więcej
export interface TokenPayload {
  userId: string;
}

export interface TokenService {
  issueAccessToken(payload: TokenPayload): Promise<string>;
  issueRefreshToken(payload: TokenPayload): Promise<string>;
  verifyAccessToken(token: string): Promise<TokenPayload>;
  verifyRefreshToken(token: string): Promise<TokenPayload>;
}
