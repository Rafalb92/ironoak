import { DomainEvent } from '../../../../shared-kernel/domain/domain-event.base';
import { PaymentEventName } from './payment-event-names';

export class PaymentFailedEvent extends DomainEvent {
  constructor(
    public readonly orderId: string,
    public readonly paymentId: string,
    public readonly reason: string,
  ) {
    super();
  }

  get eventName(): string {
    return PaymentEventName.FAILED;
  }

  toPayload(): Record<string, unknown> {
    return {
      orderId: this.orderId,
      paymentId: this.paymentId,
      reason: this.reason,
    };
  }
}
