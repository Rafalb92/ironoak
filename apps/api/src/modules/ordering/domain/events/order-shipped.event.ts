import { DomainEvent } from 'src/shared-kernel/domain/domain-event.base';

export class OrderShippedEvent extends DomainEvent {
  constructor(public readonly orderId: string) {
    super();
  }
  get eventName(): string {
    return 'order.shipped';
  }
}
