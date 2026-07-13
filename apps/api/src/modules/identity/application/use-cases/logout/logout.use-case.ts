import { Inject, Injectable } from '@nestjs/common';
import {
  TOKEN_SERVICE,
  type TokenService,
} from '../../ports/token-service.port';
import {
  REFRESH_TOKEN_STORE,
  type RefreshTokenStore,
} from '../../ports/refresh-token-store.port';

@Injectable()
export class LogoutUseCase {
  constructor(
    @Inject(TOKEN_SERVICE) private readonly tokens: TokenService,
    @Inject(REFRESH_TOKEN_STORE) private readonly store: RefreshTokenStore,
  ) {}

  async execute(refreshToken: string | undefined): Promise<void> {
    // Brak tokena = i tak wylogowujemy (kontroler wyczyści cookies).
    if (!refreshToken) return;

    try {
      const { userId, jti } =
        await this.tokens.verifyRefreshToken(refreshToken);
      await this.store.remove(userId, jti);
    } catch {
      // Token nieważny/wygasły — nie ma czego unieważniać.
      // Logout ZAWSZE się udaje z perspektywy klienta.
    }
  }
}
