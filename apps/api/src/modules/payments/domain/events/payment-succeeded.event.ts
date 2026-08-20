import { DomainEvent } from '../../../../shared-kernel/domain/domain-event.base';
import { Money } from '../../../../shared-kernel/domain/value-objects/money.vo';
import { PaymentEventName } from './payment-event-names';

export class PaymentSucceededEvent extends DomainEvent {
  constructor(
    public readonly orderId: string,
    public readonly paymentId: string,
    public readonly amount: Money,
  ) {
    super();
  }

  get eventName(): string {
    return PaymentEventName.SUCCEEDED;
  }

  toPayload(): Record<string, unknown> {
    return {
      orderId: this.orderId,
      paymentId: this.paymentId,
      amount: this.amount.amount,
      currency: this.amount.currency,
    };
  }
}
