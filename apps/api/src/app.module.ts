import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import config from './mikro-orm.config';
import { IdentityModule } from './modules/identity/identity.module';
import { LoggerModule } from 'nestjs-pino';
import { CatalogModule } from './modules/catalog/catalog.module';

@Module({
  imports: [
    MikroOrmModule.forRoot(config),
    ConfigModule.forRoot({ isGlobal: true }),
    LoggerModule.forRoot({
      pinoHttp: {
        transport:
          process.env.NODE_ENV !== 'production'
            ? {
                target: 'pino-pretty',
                options: {
                  singleLine: true,
                  translateTime: 'SYS:HH:MM:ss.l',
                  ignore: 'pid,hostname,req,res',
                  messageFormat: '{context} | {msg}',
                },
              }
            : undefined,
        level:
          process.env.LOG_LEVEL ??
          (process.env.NODE_ENV !== 'production' ? 'debug' : 'info'),
        autoLogging: {
          ignore: (req) => req.url === '/health',
        },
        customProps: (req) => ({ context: 'HTTP' }),
        serializers: {
          req: (req) => ({ method: req.method, url: req.url }),
          res: (res) => ({ statusCode: res.statusCode }),
        },
        redact: {
          paths: [
            'req.headers.authorization',
            'req.headers.cookie',
            'password',
            '*.password',
          ],
          remove: true,
        },
      },
    }),

    IdentityModule,
    CatalogModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
