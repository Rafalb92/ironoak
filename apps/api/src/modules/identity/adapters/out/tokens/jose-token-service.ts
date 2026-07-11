import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import { randomUUID } from 'node:crypto';
import type {
  TokenService,
  AccessTokenPayload,
  RefreshTokenPayload,
  IssuedRefreshToken,
} from '../../../application/ports/token-service.port';

interface JoseTokenConfig {
  accessSecret: Uint8Array;
  refreshSecret: Uint8Array;
  accessTtl: string;
  refreshTtl: string;
}

const ARGON2ID = 2; // (jeśli miałeś tu inne stałe, zostaw — to tylko przykład kontekstu)

export class JoseTokenService implements TokenService {
  constructor(private readonly config: JoseTokenConfig) {}

  issueAccessToken(payload: AccessTokenPayload): Promise<string> {
    return new SignJWT({ userId: payload.userId })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(this.config.accessTtl)
      .sign(this.config.accessSecret);
  }

  async issueRefreshToken(
    payload: AccessTokenPayload,
  ): Promise<IssuedRefreshToken> {
    const jti = randomUUID();
    const token = await new SignJWT({ userId: payload.userId })
      .setProtectedHeader({ alg: 'HS256' })
      .setJti(jti)
      .setIssuedAt()
      .setExpirationTime(this.config.refreshTtl)
      .sign(this.config.refreshSecret);
    return { token, jti };
  }

  async verifyAccessToken(token: string): Promise<AccessTokenPayload> {
    const { payload } = await jwtVerify(token, this.config.accessSecret);
    return { userId: this.extractUserId(payload) };
  }

  async verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
    const { payload } = await jwtVerify(token, this.config.refreshSecret);
    if (typeof payload.jti !== 'string') {
      throw new Error('Refresh token missing jti');
    }
    return { userId: this.extractUserId(payload), jti: payload.jti };
  }

  private extractUserId(payload: JWTPayload): string {
    if (typeof payload.userId !== 'string') {
      throw new Error('Invalid token payload: missing userId');
    }
    return payload.userId;
  }
}
