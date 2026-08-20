import { Injectable, Logger } from '@nestjs/common';

import { Inject } from '@nestjs/common';
import {
  PAYMENT_REPOSITORY,
  type PaymentRepository,
} from '../../ports/payment.repository.port';
import { MikroORM } from '@mikro-orm/postgresql';
import { CreateRequestContext } from '@mikro-orm/decorators/legacy';
import type { PaymentWebhookEvent } from '../../ports/payment-provider.port';
@Injectable()
export class HandlePaymentWebhookUseCase {
  private readonly logger = new Logger(HandlePaymentWebhookUseCase.name);

  constructor(
    @Inject(PAYMENT_REPOSITORY) private readonly payments: PaymentRepository,
    private readonly orm: MikroORM,
  ) {}

  @CreateRequestContext()
  async execute(event: PaymentWebhookEvent): Promise<void> {
    const payment = await this.payments.findBySessionId(event.sessionId);
    if (!payment) {
      this.logger.warn(`No payment for session ${event.sessionId}`);
      return;
    }

    if (event.type === 'payment.succeeded') {
      payment.markSucceeded();
    } else {
      payment.markFailed(event.reason ?? 'Payment failed');
    }

    await this.payments.save(payment);
  }
}
