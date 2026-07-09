import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import {
  USER_REPOSITORY,
  type UserRepository,
} from '../../ports/user.repository.port';
import {
  PASSWORD_HASHER,
  type PasswordHasher,
} from '../../ports/password-hasher.port';
import {
  TOKEN_SERVICE,
  type TokenService,
} from '../../ports/token-service.port';
import { LoginUserCommand } from './login-user.command';

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class LoginUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasher,
    @Inject(TOKEN_SERVICE) private readonly tokens: TokenService,
  ) {}

  async execute(command: LoginUserCommand): Promise<LoginResult> {
    // 1. znajdź usera (z accountami)
    const user = await this.users.findByEmail(command.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // 2. znajdź jego account logowania hasłem
    const credential = user.accounts
      .getItems()
      .find((account) => account.providerId === 'credential');

    if (!credential?.password) {
      // user istnieje, ale nie ma logowania hasłem (np. tylko Google)
      throw new UnauthorizedException('Invalid credentials');
    }

    // 3. zweryfikuj hasło (ten sam port co przy rejestracji)
    const passwordValid = await this.hasher.verify(
      credential.password,
      command.plainPassword,
    );
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // 4. wydaj tokeny
    const [accessToken, refreshToken] = await Promise.all([
      this.tokens.issueAccessToken({ userId: user.id }),
      this.tokens.issueRefreshToken({ userId: user.id }),
    ]);

    return { accessToken, refreshToken };
  }
}
