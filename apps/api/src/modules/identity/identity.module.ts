import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { UserSchema } from './domain/user.entity';
import { AccountSchema } from './domain/account.entity';
import { PASSWORD_HASHER } from './application/ports/password-hasher.port';
import { ConfigService } from '@nestjs/config';
import { Argon2PasswordHasher } from './adapters/out/hashing/argon2-password-hasher';
import { TOKEN_SERVICE } from './application/ports/token-service';
import { JoseTokenService } from './adapters/out/tokens/jose-token-service';

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
  ],
  exports: [PASSWORD_HASHER, TOKEN_SERVICE],
})
export class IdentityModule {}
