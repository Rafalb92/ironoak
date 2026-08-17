import { DomainEvent } from '../../../../shared-kernel/domain/domain-event.base';
import { InventoryEventName } from './inventory-event-names';

// stock-released.event.ts
export class StockReleasedEvent extends DomainEvent {
  constructor(public readonly orderId: string) {
    super();
  }
  get eventName(): string {
    return InventoryEventName.STOCK_RELEASED;
  }
  toPayload() {
    return { orderId: this.orderId };
  }
}
