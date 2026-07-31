import { DomainEvent } from '../../../../shared-kernel/domain/domain-event.base';
import { OrderEventName } from './order-event-names';

// order-paid.event.ts
export class OrderPaidEvent extends DomainEvent {
  constructor(public readonly orderId: string) {
    super();
  }
  get eventName(): string {
    return OrderEventName.PAID;
  }
}
