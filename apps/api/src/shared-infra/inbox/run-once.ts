import type { Logger } from '@nestjs/common';
import {
  type EntityManager,
  UniqueConstraintViolationException,
} from '@mikro-orm/postgresql';
import { InboxMessageEntity } from './inbox-message.entity';

/**
 * Runs `work` at most once per (eventId, handlerName) — ADR-0007.
 *
 * 1. Claim the event in the inbox. A duplicate delivery fails here and is skipped.
 * 2. Run the work.
 * 3. If the work fails, release the claim and rethrow, so replaying the event
 *    (e.g. resetting it in the outbox) is processed instead of being skipped.
 *
 * Precondition: `work` must be all-or-nothing (one transaction). If it could
 * commit part of its changes and then throw, a replay would apply that part twice.
 */
export async function runOnce(
  em: EntityManager,
  eventId: string,
  handlerName: string,
  logger: Logger,
  work: () => Promise<void>,
): Promise<void> {
  const fork = em.fork();

  try {
    fork.create(InboxMessageEntity, { eventId, handlerName });
    await fork.flush();
  } catch (error) {
    if (error instanceof UniqueConstraintViolationException) {
      logger.debug(
        `Event ${eventId} already handled by ${handlerName}, skipping`,
      );
      return;
    }
    throw error;
  }

  try {
    await work();
  } catch (error) {
    await fork.nativeDelete(InboxMessageEntity, { eventId, handlerName });
    logger.error(
      `Failed to handle ${eventId} by ${handlerName}; claim released`,
      error,
    );
    throw error;
  }
}
