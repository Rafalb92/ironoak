import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EntityManager } from '@mikro-orm/postgresql';
import { runOnce } from '../../../../shared-infra/inbox/run-once';
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
    await runOnce(
      this.em,
      event.eventId,
      PaymentSucceededListener.name,
      this.logger,
      () => this.confirmPayment.execute(event.payload.orderId),
    );
  }
}
