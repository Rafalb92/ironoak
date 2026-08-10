import { DomainEvent } from '../../../../shared-kernel/domain/domain-event.base';
import { OrderEventName } from './order-event-names';

export class OrderShippedEvent extends DomainEvent {
  constructor(public readonly orderId: string) {
    super();
  }
  get eventName(): string {
    return OrderEventName.SHIPPED;
  }

  toPayload(): Record<string, unknown> {
    return { orderId: this.orderId };
  }
}
