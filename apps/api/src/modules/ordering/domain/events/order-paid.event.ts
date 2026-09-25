import { DomainEvent } from '../../../../shared-kernel/domain/domain-event.base';
import { OrderLine } from '../value-objects/order-line.vo';
import { OrderEventName } from './order-event-names';

export class OrderPaidEvent extends DomainEvent {
  constructor(
    public readonly orderId: string,
    public readonly lines: readonly OrderLine[],
  ) {
    super();
  }

  get eventName(): string {
    return OrderEventName.PAID;
  }

  // lines let consumers (e.g. Catalog sales ranking) react without querying Ordering
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
