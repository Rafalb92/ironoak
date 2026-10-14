import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EntityManager } from '@mikro-orm/postgresql';
import { runOnce } from '../../../../../shared-infra/inbox/run-once';
import { InventoryEventName } from '../../../../inventory/domain/events/inventory-event-names';
import { CancelOrderBySystemUseCase } from '../../../application/use-cases/cancel-order-by-system/cancel-order-by-system.use-case';

interface IntegrationEvent {
  eventId: string;
  aggregateId: string;
  aggregateType: string;
  occurredAt: Date;
  payload: { orderId: string; reason: string };
}

@Injectable()
export class StockReservationFailedListener {
  private readonly logger = new Logger(StockReservationFailedListener.name);

  constructor(
    private readonly em: EntityManager,
    private readonly cancelOrder: CancelOrderBySystemUseCase,
  ) {}

  @OnEvent(InventoryEventName.STOCK_RESERVATION_FAILED, { promisify: true })
  async handle(event: IntegrationEvent): Promise<void> {
    await runOnce(
      this.em,
      event.eventId,
      StockReservationFailedListener.name,
      this.logger,
      () =>
        this.cancelOrder.execute(
          event.payload.orderId,
          `Out of stock: ${event.payload.reason}`,
        ),
    );
  }
}
