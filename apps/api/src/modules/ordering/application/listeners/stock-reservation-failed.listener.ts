import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  EntityManager,
  UniqueConstraintViolationException,
} from '@mikro-orm/postgresql';
import { InboxMessageEntity } from '../../../../shared-infra/inbox/inbox-message.entity';
import { InventoryEventName } from '../../../inventory/domain/events/inventory-event-names';
import { CancelOrderBySystemUseCase } from '../use-cases/cancel-order-by-system/cancel-order-by-system.use-case';

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
    const handlerName = StockReservationFailedListener.name;
    const em = this.em.fork();

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

    await this.cancelOrder.execute(
      event.payload.orderId,
      `Out of stock: ${event.payload.reason}`,
    );
  }
}
