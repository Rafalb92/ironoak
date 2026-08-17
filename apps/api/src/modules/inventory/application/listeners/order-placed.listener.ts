import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  EntityManager,
  UniqueConstraintViolationException,
} from '@mikro-orm/postgresql';
import { InboxMessageEntity } from '../../../../shared-infra/inbox/inbox-message.entity';
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
    const handlerName = InventoryOrderPlacedListener.name;
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

    await this.reserveStock.execute({
      orderId: event.payload.orderId,
      lines: event.payload.lines,
    });
  }
}
