import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  EntityManager,
  UniqueConstraintViolationException,
} from '@mikro-orm/postgresql';
import { InboxMessageEntity } from '../../../../shared-infra/inbox/inbox-message.entity';
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
    const handlerName = InventoryOrderShippedListener.name;
    const em = this.em.fork();

    // idempotencja — zajmij zdarzenie zanim ruszysz logikę
    try {
      em.create(InboxMessageEntity, { eventId: event.eventId, handlerName });
      await em.flush();
    } catch (error) {
      if (error instanceof UniqueConstraintViolationException) {
        this.logger.debug(
          `Event ${event.eventId} already handled by ${handlerName}, skipping`,
        );
        return;
      }
      throw error;
    }

    await this.shipStock.execute({
      orderId: event.payload.orderId,
      lines: event.payload.lines,
    });
  }
}
