// order-placed.event.ts
import { DomainEvent } from '../../../../shared-kernel/domain/domain-event.base';
import { Money } from '../value-objects/money.vo';
import { OrderLine } from '../value-objects/order-line.vo';
import { OrderEventName } from './order-event-names';

export class OrderPlacedEvent extends DomainEvent {
  constructor(
    public readonly orderId: string,
    public readonly customerId: string,
    public readonly total: Money,
    public readonly lines: OrderLine[],
  ) {
    super();
  }
  get eventName(): string {
    return OrderEventName.PLACED;
  }

  toPayload(): Record<string, unknown> {
    return {
      orderId: this.orderId,
      customerId: this.customerId,
      totalAmount: this.total.amount,
      currency: this.total.currency,
      lines: this.lines.map((line) => ({
        productVariantId: line.productVariantId,
        quantity: line.quantity,
      })),
    };
  }
}
