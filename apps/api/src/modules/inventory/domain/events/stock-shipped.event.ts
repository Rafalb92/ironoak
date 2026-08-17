import { DomainEvent } from '../../../../shared-kernel/domain/domain-event.base';
import { InventoryEventName } from './inventory-event-names';

// stock-shipped.event.ts
export class StockShippedEvent extends DomainEvent {
  constructor(public readonly orderId: string) {
    super();
  }
  get eventName(): string {
    return InventoryEventName.STOCK_SHIPPED;
  }
  toPayload() {
    return { orderId: this.orderId };
  }
}
