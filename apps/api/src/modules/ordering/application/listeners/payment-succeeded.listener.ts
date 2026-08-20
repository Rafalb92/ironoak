import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  EntityManager,
  UniqueConstraintViolationException,
} from '@mikro-orm/postgresql';
import { InboxMessageEntity } from '../../../../shared-infra/inbox/inbox-message.entity';
import { PaymentEventName } from '../../../payments/domain/events/payment-event-names';
import { ConfirmPaymentBySystemUseCase } from '../use-cases/confirm-payment-by-system/confirm-payment-by-system.use-case';

interface IntegrationEvent {
  eventId: string;
  aggregateId: string;
  aggregateType: string;
  occurredAt: Date;
  payload: {
    orderId: string;
    paymentId: string;
    amount: number;
    currency: string;
  };
}

@Injectable()
export class PaymentSucceededListener {
  private readonly logger = new Logger(PaymentSucceededListener.name);

  constructor(
    private readonly em: EntityManager,
    private readonly confirmPayment: ConfirmPaymentBySystemUseCase,
  ) {}

  @OnEvent(PaymentEventName.SUCCEEDED, { promisify: true })
  async handle(event: IntegrationEvent): Promise<void> {
    const handlerName = PaymentSucceededListener.name;
    const em = this.em.fork();

    try {
      em.create(InboxMessageEntity, { eventId: event.eventId, handlerName });
      await em.flush();
    } catch (error) {
      if (error instanceof UniqueConstraintViolationException) {
        this.logger.debug(
          `Event ${event.eventId} already handled by ${handlerName}, skipping`,
        );
        return;
      }
      throw error;
    }

    await this.confirmPayment.execute(event.payload.orderId);
  }
}
