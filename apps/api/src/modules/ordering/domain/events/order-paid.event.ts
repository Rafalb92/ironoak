import { DomainEvent } from 'src/shared-kernel/domain/domain-event.base';

// order-paid.event.ts
export class OrderPaidEvent extends DomainEvent {
  constructor(public readonly orderId: string) {
    super();
  }
  get eventName(): string {
    return 'order.paid';
  }
}
