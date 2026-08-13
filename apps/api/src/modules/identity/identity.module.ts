import { Module } from '@nestjs/common';
import Redis from 'ioredis';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { UserSchema } from './domain/user.entity';
import { AccountSchema } from './domain/account.entity';
import { PASSWORD_HASHER } from './application/ports/password-hasher.port';
import { ConfigService } from '@nestjs/config';
import { Argon2PasswordHasher } from './adapters/out/hashing/argon2-password-hasher';

import { EntityManager } from '@mikro-orm/postgresql';
import { MikroOrmUserRepository } from './adapters/out/persistence/mikro-orm-user.repository';
import { USER_REPOSITORY } from './application/ports/user.repository.port';
import { RegisterUserUseCase } from './application/use-cases/register-user/register-user.use-case';
import { RegisterUserController } from './adapters/in/http/register-user.controller';
import { LoginUserController } from './adapters/in/http/login-user.controller';
import { MeController } from './adapters/in/http/me.controller';
import { LoginUserUseCase } from './application/use-cases/login-user/login-user.use-case';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { REFRESH_TOKEN_STORE } from './application/ports/refresh-token-store.port';
import { RedisRefreshTokenStore } from './adapters/out/persistence/redis-refresh-token-store';
import { REDIS_CLIENT } from '../../shared-infra/redis/redis.module';
import { RefreshTokenUseCase } from './application/use-cases/refresh-token.use-case';
import { LogoutController } from './adapters/in/http/logout.controller';
import { RefreshTokenController } from './adapters/in/http/refresh-token.controller';
import { LogoutUseCase } from './application/use-cases/logout/logout.use-case';

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
      provide: USER_REPOSITORY,
      useFactory: (em: EntityManager) => new MikroOrmUserRepository(em),
      inject: [EntityManager],
    },
    {
      provide: REFRESH_TOKEN_STORE,
      useFactory: (redis: Redis) => new RedisRefreshTokenStore(redis),
      inject: [REDIS_CLIENT],
    },
    RegisterUserUseCase,
    LoginUserUseCase,
    JwtAuthGuard,
    RefreshTokenUseCase,
    LogoutUseCase,
  ],
  controllers: [
    RegisterUserController,
    LoginUserController,
    MeController,
    LogoutController,
    RefreshTokenController,
  ],
  exports: [PASSWORD_HASHER],
})
export class IdentityModule {}
