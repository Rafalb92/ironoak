import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TOKEN_SERVICE } from './token-service.port';
import { JoseTokenService } from './jose-token-service';

@Global()
@Module({
  providers: [
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
  exports: [TOKEN_SERVICE],
})
export class TokenModule {}
