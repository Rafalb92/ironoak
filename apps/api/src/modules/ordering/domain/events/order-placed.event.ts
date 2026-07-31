// order-placed.event.ts
import { DomainEvent } from '../../../../shared-kernel/domain/domain-event.base';
import { Money } from '../value-objects/money.vo';
import { OrderEventName } from './order-event-names';

export class OrderPlacedEvent extends DomainEvent {
  constructor(
    public readonly orderId: string,
    public readonly customerId: string,
    public readonly total: Money,
  ) {
    super();
  }
  get eventName(): string {
    return OrderEventName.PLACED;
  }
}
