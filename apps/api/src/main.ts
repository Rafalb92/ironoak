import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { json, NextFunction, raw, Request, Response } from 'express';
import { AppModule } from './app.module';
import { Logger } from 'nestjs-pino';
import cookieParser from 'cookie-parser';
import { DomainExceptionFilter } from './shared/filters/domain-exception.filter';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  // bodyParser: false — parsujemy ręcznie, żeby surowe bajty (rawBody) trafiały
  // TYLKO do webhooków (podpis dostawcy liczony jest z dokładnej treści requestu);
  // reszta API dostaje zwykły, sparsowany JSON.
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
    bodyParser: false,
  });
  const logger = app.get(Logger);
  app.useLogger(logger);

  app.use('/webhooks', raw({ type: '*/*' }));
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith('/webhooks')) return next();
    json()(req, res, next);
  });

  app.use(cookieParser());
  // Swagger
  const config = new DocumentBuilder()
    .setTitle('IRONOAK API')
    .setDescription('E-commerce backend for premium home gym equipment')
    .setVersion('1.0')
    .addCookieAuth('access_token')
    .addTag('auth', 'Registration, login, token rotation')
    .addTag('catalog', 'Products, variants, categories')
    .addTag('cart', 'Shopping cart')
    .addTag('orders', 'Order placement and lifecycle')
    .addTag('payments', 'Payment initiation and webhooks')
    .addTag('admin', 'Administrative operations')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);
  app.useGlobalFilters(new DomainExceptionFilter(logger));
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
