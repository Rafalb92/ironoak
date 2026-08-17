import { DomainEvent } from '../../../../shared-kernel/domain/domain-event.base';
import { OrderLine } from '../value-objects/order-line.vo';
import { OrderEventName } from './order-event-names';

export class OrderShippedEvent extends DomainEvent {
  constructor(
    public readonly orderId: string,
    public readonly lines: OrderLine[],
  ) {
    super();
  }
  get eventName(): string {
    return OrderEventName.SHIPPED;
  }

  toPayload(): Record<string, unknown> {
    return {
      orderId: this.orderId,
      lines: this.lines.map((line) => ({
        productVariantId: line.productVariantId,
        quantity: line.quantity,
      })),
    };
  }
}
