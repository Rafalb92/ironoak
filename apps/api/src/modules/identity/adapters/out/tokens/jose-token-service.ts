import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import type {
  TokenService,
  TokenPayload,
} from '../../../application/ports/token-service';

interface JoseTokenConfig {
  accessSecret: Uint8Array;
  refreshSecret: Uint8Array;
  accessTtl: string;
  refreshTtl: string;
}

export class JoseTokenService implements TokenService {
  constructor(private readonly config: JoseTokenConfig) {}

  issueAccessToken(payload: TokenPayload): Promise<string> {
    return this.sign(payload, this.config.accessSecret, this.config.accessTtl);
  }

  issueRefreshToken(payload: TokenPayload): Promise<string> {
    return this.sign(
      payload,
      this.config.refreshSecret,
      this.config.refreshTtl,
    );
  }

  async verifyAccessToken(token: string): Promise<TokenPayload> {
    return this.verify(token, this.config.accessSecret);
  }

  async verifyRefreshToken(token: string): Promise<TokenPayload> {
    return this.verify(token, this.config.refreshSecret);
  }

  private sign(
    payload: TokenPayload,
    secret: Uint8Array,
    ttl: string,
  ): Promise<string> {
    return new SignJWT({ userId: payload.userId })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(ttl)
      .sign(secret);
  }

  private async verify(
    token: string,
    secret: Uint8Array,
  ): Promise<TokenPayload> {
    const { payload } = await jwtVerify(token, secret);
    return this.toTokenPayload(payload);
  }

  private toTokenPayload(payload: JWTPayload): TokenPayload {
    if (typeof payload.userId !== 'string') {
      throw new Error('Invalid token payload: missing userId');
    }
    return { userId: payload.userId };
  }
}
