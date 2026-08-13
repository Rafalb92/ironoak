export const TOKEN_SERVICE = Symbol('TOKEN_SERVICE');
export type UserRole = 'USER' | 'ADMIN';

export interface AccessTokenPayload {
  userId: string;
  role: UserRole;
}

export interface RefreshTokenPayload {
  userId: string;
  jti: string;
}

export interface IssuedRefreshToken {
  token: string;
  jti: string;
}

export interface TokenService {
  issueAccessToken(payload: AccessTokenPayload): Promise<string>;
  issueRefreshToken(payload: { userId: string }): Promise<IssuedRefreshToken>;
  verifyAccessToken(token: string): Promise<AccessTokenPayload>;
  verifyRefreshToken(token: string): Promise<RefreshTokenPayload>;
}
