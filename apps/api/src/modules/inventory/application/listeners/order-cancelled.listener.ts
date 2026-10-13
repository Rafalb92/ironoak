import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EntityManager } from '@mikro-orm/postgresql';
import { runOnce } from '../../../../shared-infra/inbox/run-once';
import { OrderEventName } from '../../../ordering/domain/events/order-event-names';
import { ReleaseStockUseCase } from '../use-cases/release-stock/release-stock.use-case';

interface IntegrationEvent {
  eventId: string;
  aggregateId: string;
  aggregateType: string;
  occurredAt: Date;
  payload: {
    orderId: string;
    reason: string;
    lines: Array<{ productVariantId: string; quantity: number }>;
  };
}

@Injectable()
export class InventoryOrderCancelledListener {
  private readonly logger = new Logger(InventoryOrderCancelledListener.name);

  constructor(
    private readonly em: EntityManager,
    private readonly releaseStock: ReleaseStockUseCase,
  ) {}

  @OnEvent(OrderEventName.CANCELLED, { promisify: true })
  async handle(event: IntegrationEvent): Promise<void> {
    await runOnce(
      this.em,
      event.eventId,
      InventoryOrderCancelledListener.name,
      this.logger,
      () =>
        this.releaseStock.execute({
          orderId: event.payload.orderId,
          lines: event.payload.lines,
        }),
    );
  }
}
