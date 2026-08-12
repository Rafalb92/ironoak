import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { OrderEventName } from '../../domain/events/order-event-names';
import {
  EntityManager,
  UniqueConstraintViolationException,
} from '@mikro-orm/postgresql';
import { InboxMessageEntity } from '../../../../shared-infra/inbox/inbox-message.entity';
interface IntegrationEvent {
  eventId: string;
  aggregateId: string;
  aggregateType: string;
  occurredAt: Date;
  payload: Record<string, unknown>;
}

@Injectable()
export class OrderPlacedListener {
  private readonly logger = new Logger(OrderPlacedListener.name);

  constructor(private readonly em: EntityManager) {}

  @OnEvent(OrderEventName.PLACED, { promisify: true })
  async handle(event: IntegrationEvent): Promise<void> {
    const handlerName = OrderPlacedListener.name;
    const em = this.em.fork();

    try {
      await em.transactional(async (tx) => {
        tx.create(InboxMessageEntity, { eventId: event.eventId, handlerName });
        // TU logika biznesowa — w tej samej transakcji co wpis inbox
        this.logger.log(
          `Handling ${OrderEventName.PLACED} for order ${event.aggregateId}`,
        );
      });
    } catch (error) {
      if (error instanceof UniqueConstraintViolationException) {
        this.logger.debug(
          `Event ${event.eventId} already handled by ${handlerName}, skipping`,
        );
        return;
      }
      this.logger.error(
        `Error handling ${event.eventId} by ${handlerName}`,
        error,
      );
      throw error;
    }
  }
}
