import {
  Controller,
  Inject,
  Post,
  HttpCode,
  HttpStatus,
  Req,
  Headers,
  BadRequestException,
} from '@nestjs/common';
import type { Request } from 'express';
import {
  PAYMENT_PROVIDER,
  PaymentWebhookEvent,
  type PaymentProvider,
} from '../../application/ports/payment-provider.port';
import { HandlePaymentWebhookUseCase } from '../../application/use-cases/handle-payment-webhook/handle-payment-webhook.use-case';
import { EntityManager } from '@mikro-orm/postgresql';

import { UniqueConstraintViolationException } from '@mikro-orm/core';
import { InboxMessageEntity } from '../../../../shared-infra/inbox/inbox-message.entity';
import { UnsupportedWebhookEventError } from '../providers/stripe-payment.provider';
import { ApiExcludeEndpoint, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('payments')
@Controller('webhooks')
export class PaymentWebhookController {
  constructor(
    @Inject(PAYMENT_PROVIDER) private readonly provider: PaymentProvider,
    private readonly handleWebhook: HandlePaymentWebhookUseCase,
    private readonly em: EntityManager,
  ) {}

  @Post('stripe')
  @HttpCode(HttpStatus.OK)
  @ApiExcludeEndpoint() // opcjonalnie — ukryj z docs
  @ApiOperation({
    summary: 'Stripe webhook',
    description:
      'Called by Stripe, not by clients. Authenticated by signature, not by session. ' +
      'Always returns 200, including for duplicate or unsupported events, to prevent retries.',
  })
  async stripe(
    @Req() req: Request,
    @Headers('stripe-signature') signature: string,
  ): Promise<{ received: true }> {
    let event: PaymentWebhookEvent;
    try {
      event = this.provider.verifyWebhook(req.body as Buffer, signature);
    } catch (error) {
      if (error instanceof UnsupportedWebhookEventError) {
        return { received: true }; // ignorujemy, ale potwierdzamy odbiór
      }
      throw new BadRequestException('Invalid webhook signature');
    }
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
