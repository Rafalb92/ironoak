import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { UserSchema } from './domain/user.entity';
import { AccountSchema } from './domain/account.entity';
import { PASSWORD_HASHER } from './application/ports/password-hasher.port';
import { ConfigService } from '@nestjs/config';
import { Argon2PasswordHasher } from './adapters/out/hashing/argon2-password-hasher';

import { JoseTokenService } from './adapters/out/tokens/jose-token-service';
import { EntityManager } from '@mikro-orm/postgresql';
import { MikroOrmUserRepository } from './adapters/out/persistence/mikro-orm-user.repository';
import { USER_REPOSITORY } from './application/ports/user.repository.port';
import { RegisterUserUseCase } from './application/use-cases/register-user/register-user.use-case';
import { RegisterUserController } from './adapters/in/http/register-user.controller';
import { TOKEN_SERVICE } from './application/ports/token-service.port';
import { LoginUserController } from './adapters/in/http/login-user.controller';
import { LoginUserUseCase } from './application/use-cases/login-user/login-user.use-case';

@Module({
  imports: [MikroOrmModule.forFeature([UserSchema, AccountSchema])],
  providers: [
    {
      provide: PASSWORD_HASHER,
      useFactory: (config: ConfigService) =>
        new Argon2PasswordHasher(
          Buffer.from(config.getOrThrow<string>('AUTH_PEPPER')),
        ),
      inject: [ConfigService],
    },
    {
      provide: TOKEN_SERVICE,
      useFactory: (config: ConfigService) =>
        new JoseTokenService({
          accessSecret: new TextEncoder().encode(
            config.getOrThrow<string>('JWT_ACCESS_SECRET'),
          ),
          refreshSecret: new TextEncoder().encode(
            config.getOrThrow<string>('JWT_REFRESH_SECRET'),
          ),
          accessTtl: config.getOrThrow<string>('JWT_ACCESS_TTL'),
          refreshTtl: config.getOrThrow<string>('JWT_REFRESH_TTL'),
        }),
      inject: [ConfigService],
    },
    {
      provide: USER_REPOSITORY,
      useFactory: (em: EntityManager) => new MikroOrmUserRepository(em),
      inject: [EntityManager],
    },
    RegisterUserUseCase,
    LoginUserUseCase,
  ],
  controllers: [RegisterUserController, LoginUserController],
  exports: [PASSWORD_HASHER, TOKEN_SERVICE],
})
export class IdentityModule {}
