import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OrderingModule } from '../ordering/ordering.module';
import { IdentityModule } from '../identity/identity.module';
import { EMAIL_SENDER } from './application/ports/email-sender.port';
import { ORDER_READER } from './application/ports/order-reader.port';
import { CUSTOMER_DIRECTORY } from './application/ports/customer-directory.port';
import { SmtpEmailSender } from './adapters/out/email/smtp-email-sender';
import { OrderingOrderReader } from './adapters/out/ordering/ordering-order-reader';
import { IdentityCustomerDirectory } from './adapters/out/identity/identity-customer-directory';
import { EmailDispatcher } from './application/services/email-dispatcher.service';
import { OrderNotificationsService } from './application/services/order-notifications.service';
import { OrderEmailsListener } from './adapters/in/events/order-emails.listener';
import { SentEmailQueryService } from './application/services/sent-email-query.service';
import { AdminOrderEmailsController } from './adapters/in/http/admin-order-emails.controller';

@Module({
  imports: [OrderingModule, IdentityModule],
  providers: [
    {
      provide: EMAIL_SENDER,
      useFactory: (config: ConfigService) =>
        new SmtpEmailSender({
          host: config.getOrThrow<string>('MAIL_HOST'),
          port: Number(config.getOrThrow<string>('MAIL_PORT')),
          secure: config.get<string>('MAIL_SECURE') === 'true',
          user: config.get<string>('MAIL_USER') || undefined,
          password: config.get<string>('MAIL_PASSWORD') || undefined,
          from: config.getOrThrow<string>('MAIL_FROM'),
        }),
      inject: [ConfigService],
    },
    { provide: ORDER_READER, useClass: OrderingOrderReader },
    { provide: CUSTOMER_DIRECTORY, useClass: IdentityCustomerDirectory },
    EmailDispatcher,
    OrderNotificationsService,
    OrderEmailsListener,
    SentEmailQueryService,
  ],
  controllers: [AdminOrderEmailsController],
})
export class NotificationsModule {}
