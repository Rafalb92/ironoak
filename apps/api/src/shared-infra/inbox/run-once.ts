import type { Logger } from '@nestjs/common';
import { TransactionContext } from '@mikro-orm/core';
import {
  type EntityManager,
  UniqueConstraintViolationException,
} from '@mikro-orm/postgresql';
import { InboxMessageEntity } from './inbox-message.entity';

/**
 * Runs `work` at most once per (eventId, handlerName) — ADR-0007.
 *
 * 1. Claim the event in the inbox. A duplicate delivery fails here and is skipped.
 * 2. Run the work in its own, clean MikroORM context.
 * 3. If the work fails, release the claim and rethrow, so replaying the event
 *    (e.g. resetting it in the outbox) is processed instead of being skipped.
 *
 * Why a clean context: the outbox publisher emits inside its transaction, and
 * listeners inherit that transaction through AsyncLocalStorage. The publisher
 * does not wait for them — once it commits, any query a listener makes through
 * the global EntityManager lands on a committed transaction. TransactionContext
 * wins over RequestContext when MikroORM resolves the current context, so the
 * work runs inside a fresh fork set as the transaction context.
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
    // a fresh fork: the work never sees the publisher's (soon committed) transaction
    await TransactionContext.create(em.fork(), work);
  } catch (error) {
    await fork.nativeDelete(InboxMessageEntity, { eventId, handlerName });
    logger.error(
      `Failed to handle ${eventId} by ${handlerName}; claim released`,
      error,
    );
    throw error;
  }
}
