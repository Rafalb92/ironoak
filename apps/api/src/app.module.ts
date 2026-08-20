import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import config from './mikro-orm.config';
import { IdentityModule } from './modules/identity/identity.module';
import { LoggerModule } from 'nestjs-pino';
import { CatalogModule } from './modules/catalog/catalog.module';
import { OrderingModule } from './modules/ordering/ordering.module';
import { ScheduleModule } from '@nestjs/schedule';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { OutboxModule } from './shared-infra/outbox/outbox.module';
import { RedisModule } from './shared-infra/redis/redis.module';
import { CartModule } from './modules/cart/cart.module';
import { TokenModule } from './shared-infra/auth/token.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { PaymentsModule } from './modules/payments/payments.module';

@Module({
  imports: [
    MikroOrmModule.forRoot(config),
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    EventEmitterModule.forRoot(),
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
        customProps: (_) => ({ context: 'HTTP' }),
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
    RedisModule,
    IdentityModule,
    CatalogModule,
    OrderingModule,
    OutboxModule,
    CartModule,
    TokenModule,
    InventoryModule,
    PaymentsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
