import { DomainEvent } from '../../../../shared-kernel/domain/domain-event.base';
import { InventoryEventName } from './inventory-event-names';

// stock-reserved.event.ts
export class StockReservedEvent extends DomainEvent {
  constructor(public readonly orderId: string) {
    super();
  }
  get eventName(): string {
    return InventoryEventName.STOCK_RESERVED;
  }
  toPayload() {
    return { orderId: this.orderId };
  }
}

// stock-reservation-failed.event.ts
export class StockReservationFailedEvent extends DomainEvent {
  constructor(
    public readonly orderId: string,
    public readonly reason: string,
  ) {
    super();
  }
  get eventName(): string {
    return InventoryEventName.STOCK_RESERVATION_FAILED;
  }
  toPayload() {
    return { orderId: this.orderId, reason: this.reason };
  }
}
