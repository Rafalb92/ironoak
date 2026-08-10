import { EntityManager } from '@mikro-orm/postgresql';
import type { DomainEvent } from '../../shared-kernel/domain/domain-event.base';
import { OutboxMessageSchema } from './outbox-message.entity';

export class OutboxWriter {
  // NIE robi flush — zapis dołącza się do bieżącej jednostki pracy
  static append(
    em: EntityManager,
    events: readonly DomainEvent[],
    aggregateId: string,
    aggregateType: string,
  ): void {
    for (const event of events) {
      em.create(OutboxMessageSchema, {
        eventId: event.eventId,
        aggregateId,
        aggregateType,
        eventName: event.eventName,
        payload: event.toPayload(),
        occurredAt: event.occurredAt,
      });
    }
  }
}
