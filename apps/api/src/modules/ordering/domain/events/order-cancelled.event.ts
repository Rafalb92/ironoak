import { DomainEvent } from '../../../../shared-kernel/domain/domain-event.base';
import { OrderLine } from '../value-objects/order-line.vo';
import { OrderEventName } from './order-event-names';

export class OrderCancelledEvent extends DomainEvent {
  constructor(
    public readonly orderId: string,
    public readonly reason: string,
    public readonly lines: OrderLine[],
  ) {
    super();
  }
  get eventName(): string {
    return OrderEventName.CANCELLED;
  }

  toPayload() {
    return {
      orderId: this.orderId,
      reason: this.reason,
      lines: this.lines.map((line) => ({
        productVariantId: line.productVariantId,
        quantity: line.quantity,
      })),
    };
  }
}
