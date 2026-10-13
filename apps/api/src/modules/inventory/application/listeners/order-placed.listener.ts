import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EntityManager } from '@mikro-orm/postgresql';
import { runOnce } from '../../../../shared-infra/inbox/run-once';
import { OrderEventName } from '../../../ordering/domain/events/order-event-names';
import { ReserveStockUseCase } from '../use-cases/reserve-stock/reserve-stock.command';

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
export class InventoryOrderPlacedListener {
  private readonly logger = new Logger(InventoryOrderPlacedListener.name);

  constructor(
    private readonly em: EntityManager,
    private readonly reserveStock: ReserveStockUseCase,
  ) {}

  @OnEvent(OrderEventName.PLACED, { promisify: true })
  async handle(event: IntegrationEvent): Promise<void> {
    await runOnce(
      this.em,
      event.eventId,
      InventoryOrderPlacedListener.name,
      this.logger,
      () =>
        this.reserveStock.execute({
          orderId: event.payload.orderId,
          lines: event.payload.lines,
        }),
    );
  }
}
