import { DomainEvent } from 'src/shared-kernel/domain/domain-event.base';

export class OrderCancelledEvent extends DomainEvent {
  constructor(
    public readonly orderId: string,
    public readonly reason: string,
  ) {
    super();
  }
  get eventName(): string {
    return 'order.cancelled';
  }
}
