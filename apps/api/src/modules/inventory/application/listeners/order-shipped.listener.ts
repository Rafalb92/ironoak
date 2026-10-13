import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EntityManager } from '@mikro-orm/postgresql';
import { runOnce } from '../../../../shared-infra/inbox/run-once';
import { OrderEventName } from '../../../ordering/domain/events/order-event-names';
import { ShipStockUseCase } from '../use-cases/ship-stock/ship-stock.use-case';

interface IntegrationEvent {
  eventId: string;
  aggregateId: string;
  aggregateType: string;
  occurredAt: Date;
  payload: {
    orderId: string;
    lines: Array<{ productVariantId: string; quantity: number }>;
  };
}

@Injectable()
export class InventoryOrderShippedListener {
  private readonly logger = new Logger(InventoryOrderShippedListener.name);

  constructor(
    private readonly em: EntityManager,
    private readonly shipStock: ShipStockUseCase,
  ) {}

  @OnEvent(OrderEventName.SHIPPED, { promisify: true })
  async handle(event: IntegrationEvent): Promise<void> {
    await runOnce(
      this.em,
      event.eventId,
      InventoryOrderShippedListener.name,
      this.logger,
      () =>
        this.shipStock.execute({
          orderId: event.payload.orderId,
          lines: event.payload.lines,
        }),
    );
  }
}
