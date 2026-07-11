export const TOKEN_SERVICE = Symbol('TOKEN_SERVICE');

// payload access tokena — sama tożsamość
export interface AccessTokenPayload {
  userId: string;
}

// payload refresh tokena — tożsamość + unikalny identyfikator tokena
export interface RefreshTokenPayload {
  userId: string;
  jti: string;
}

// wynik wydania refresha — token do cookie + jti do zapisania w store
export interface IssuedRefreshToken {
  token: string;
  jti: string;
}

export interface TokenService {
  issueAccessToken(payload: AccessTokenPayload): Promise<string>;
  issueRefreshToken(payload: AccessTokenPayload): Promise<IssuedRefreshToken>;
  verifyAccessToken(token: string): Promise<AccessTokenPayload>;
  verifyRefreshToken(token: string): Promise<RefreshTokenPayload>;
}
