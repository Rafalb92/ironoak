import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { TOKEN_SERVICE, type TokenService } from '../ports/token-service.port';
import {
  REFRESH_TOKEN_STORE,
  type RefreshTokenStore,
} from '../ports/refresh-token-store.port';

@Injectable()
export class RefreshTokenUseCase {
  // Czas życia refresh tokena w sekundach (np. 7 dni).
  // Najlepiej przenieść to do ConfigService/zmiennych środowiskowych.
  private readonly REFRESH_TOKEN_TTL = 7 * 24 * 60 * 60;

  constructor(
    @Inject(TOKEN_SERVICE) private readonly tokenService: TokenService,
    @Inject(REFRESH_TOKEN_STORE)
    private readonly refreshTokenStore: RefreshTokenStore,
  ) {}

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

    // 4. Nowa para
    const newAccessToken = await this.tokenService.issueAccessToken({ userId });
    const newRefresh = await this.tokenService.issueRefreshToken({ userId });

    // 5. Zapisz nowy jti
    await this.refreshTokenStore.save(
      userId,
      newRefresh.jti,
      this.REFRESH_TOKEN_TTL,
    );

    // 6. Zwróć
    return { accessToken: newAccessToken, refreshToken: newRefresh.token };
  }
}
