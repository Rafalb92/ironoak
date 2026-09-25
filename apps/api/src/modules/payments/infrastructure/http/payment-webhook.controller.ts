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
import type { WebhookReceived } from '@ironoak/contracts';

const HANDLER_NAME = 'PaymentWebhook';

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
  @ApiExcludeEndpoint()
  @ApiOperation({
    summary: 'Stripe webhook',
    description:
      'Called by Stripe, not by clients. Authenticated by signature, not by session. ' +
      'Returns 200 for duplicate or unsupported events to prevent retries; ' +
      'returns an error when processing fails so the provider retries.',
  })
  async stripe(
    @Req() req: Request,
    @Headers('stripe-signature') signature: string,
  ): Promise<WebhookReceived> {
    let event: PaymentWebhookEvent;
    try {
      event = this.provider.verifyWebhook(req.body as Buffer, signature);
    } catch (error) {
      if (error instanceof UnsupportedWebhookEventError) {
        return { received: true }; // ignored, but acknowledged
      }
      throw new BadRequestException('Invalid webhook signature');
    }

    // idempotency — the provider's event id
    const em = this.em.fork();
    try {
      em.create(InboxMessageEntity, {
        eventId: event.eventId,
        handlerName: HANDLER_NAME,
      });
      await em.flush();
    } catch (error) {
      if (error instanceof UniqueConstraintViolationException) {
        return { received: true }; // already handled
      }
      throw error;
    }

    try {
      await this.handleWebhook.execute(event);
    } catch (error) {
      // The claim and the use case run in separate units of work. If processing
      // fails, release the claim — otherwise the provider's retry would be
      // treated as a duplicate and the payment would never be confirmed.
      await em.nativeDelete(InboxMessageEntity, {
        eventId: event.eventId,
        handlerName: HANDLER_NAME,
      });
      throw error;
    }

    return { received: true };
  }
}
