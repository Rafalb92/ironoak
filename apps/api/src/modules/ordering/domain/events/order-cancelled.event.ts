import { DomainEvent } from '../../../../shared-kernel/domain/domain-event.base';
import { OrderEventName } from './order-event-names';

export class OrderCancelledEvent extends DomainEvent {
  constructor(
    public readonly orderId: string,
    public readonly reason: string,
  ) {
    super();
  }
  get eventName(): string {
    return OrderEventName.CANCELLED;
  }

  toPayload() {
    return { orderId: this.orderId, reason: this.reason };
  }
}
