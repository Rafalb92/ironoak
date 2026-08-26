import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  TOKEN_SERVICE,
  type TokenService,
} from '../../../../shared-infra/auth/token-service.port';
import {
  REFRESH_TOKEN_STORE,
  type RefreshTokenStore,
} from '../ports/refresh-token-store.port';
import {
  USER_REPOSITORY,
  type UserRepository,
} from '../ports/user.repository.port';

@Injectable()
export class RefreshTokenUseCase {
  constructor(
    @Inject(TOKEN_SERVICE) private readonly tokenService: TokenService,
    @Inject(REFRESH_TOKEN_STORE)
    private readonly refreshTokenStore: RefreshTokenStore,
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    private readonly config: ConfigService,
  ) {}

  private get refreshTtlSeconds(): number {
    return Number(this.config.getOrThrow<string>('REFRESH_TTL_SECONDS'));
  }

  async execute(
    refreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    // 1. Weryfikacja podpisu — TYLKO to owijamy w try, bo tylko jose tu rzuca
    let payload;
    try {
      payload = await this.tokenService.verifyRefreshToken(refreshToken);
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const { userId, jti } = payload;

    // 2. Sprawdź białą listę w store
    const tokenExists = await this.refreshTokenStore.exists(userId, jti);
    if (!tokenExists) {
      // Re-use detection — ten throw teraz NIE jest połykany
      await this.refreshTokenStore.removeAllForUser(userId);
      throw new UnauthorizedException('Refresh token reuse detected');
    }

    // 3. Rotacja: usuń zużyty
    await this.refreshTokenStore.remove(userId, jti);

    // Get user:
    const user = await this.users.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User no longer exists');
    }

    // 4. Nowa para
    const newAccessToken = await this.tokenService.issueAccessToken({
      userId,
      role: user.role,
    });
    const newRefresh = await this.tokenService.issueRefreshToken({ userId });

    // 5. Zapisz nowy jti
    await this.refreshTokenStore.save(
      userId,
      newRefresh.jti,
      this.refreshTtlSeconds,
    );

    // 6. Zwróć
    return { accessToken: newAccessToken, refreshToken: newRefresh.token };
  }
}
