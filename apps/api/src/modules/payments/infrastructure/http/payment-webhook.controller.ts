import {
  Controller,
  Inject,
  Post,
  HttpCode,
  HttpStatus,
  Req,
  Headers,
} from '@nestjs/common';
import type { Request } from 'express';
import {
  PAYMENT_PROVIDER,
  type PaymentProvider,
} from '../../application/ports/payment-provider.port';
import { HandlePaymentWebhookUseCase } from '../../application/use-cases/handle-payment-webhook/handle-payment-webhook.use-case';
import { EntityManager } from '@mikro-orm/postgresql';

import { UniqueConstraintViolationException } from '@mikro-orm/core';
import { InboxMessageEntity } from '../../../../shared-infra/inbox/inbox-message.entity';

@Controller('webhooks')
export class PaymentWebhookController {
  constructor(
    @Inject(PAYMENT_PROVIDER) private readonly provider: PaymentProvider,
    private readonly handleWebhook: HandlePaymentWebhookUseCase,
    private readonly em: EntityManager,
  ) {}

  @Post('stripe')
  @HttpCode(HttpStatus.OK)
  async stripe(
    @Req() req: Request,
    @Headers('stripe-signature') signature: string,
  ): Promise<{ received: true }> {
    const event = this.provider.verifyWebhook(
      req.body as unknown as Buffer,
      signature,
    );

    // idempotencja — eventId od dostawcy
    const em = this.em.fork();
    try {
      em.create(InboxMessageEntity, {
        eventId: event.eventId,
        handlerName: 'PaymentWebhook',
      });
      await em.flush();
    } catch (error) {
      if (error instanceof UniqueConstraintViolationException) {
        return { received: true }; // już obsłużone
      }
      throw error;
    }

    await this.handleWebhook.execute(event);
    return { received: true };
  }
}
