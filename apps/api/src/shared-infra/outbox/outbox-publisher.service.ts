import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EntityManager } from '@mikro-orm/postgresql';
import { EventEmitter2 } from '@nestjs/event-emitter';

const BATCH_SIZE = 50;
const MAX_ATTEMPTS = 5;

interface OutboxRow {
  id: string;
  event_id: string;
  aggregate_id: string;
  aggregate_type: string;
  event_name: string;
  payload: Record<string, unknown>;
  occurred_at: Date;
  attempts: number;
}

@Injectable()
export class OutboxPublisherService {
  private readonly logger = new Logger(OutboxPublisherService.name);

  constructor(
    private readonly em: EntityManager,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @Cron(CronExpression.EVERY_5_SECONDS)
  async publishPending(): Promise<void> {
    // fork — own EntityManager for the scheduled job (outside any request context)
    const em = this.em.fork();

    await em.transactional(async (tx) => {
      // Raw queries MUST go through tx.execute: tx.getConnection().execute runs
      // outside the transaction (autocommit), which would release the row locks
      // immediately and let parallel workers publish the same rows (ADR-0006).
      const rows = await tx.execute<OutboxRow[]>(
        `select * from "outbox"."outbox_message"
         where "processed_at" is null and "attempts" < ?
         order by "id"
         limit ?
         for update skip locked`,
        [MAX_ATTEMPTS, BATCH_SIZE],
      );

      for (const row of rows) {
        try {
          // publish on the in-process event bus
          this.eventEmitter.emit(row.event_name, {
            eventId: row.event_id,
            aggregateId: row.aggregate_id,
            aggregateType: row.aggregate_type,
            occurredAt: row.occurred_at,
            payload: row.payload,
          });

          await tx.execute(
            `update "outbox"."outbox_message" set "processed_at" = now() where "id" = ?`,
            [row.id],
          );
        } catch (error) {
          const message =
            error instanceof Error ? error.message : String(error);
          this.logger.warn(
            `Failed to publish ${row.event_name} (${row.event_id}): ${message}`,
          );

          await tx.execute(
            `update "outbox"."outbox_message"
             set "attempts" = "attempts" + 1, "last_error" = ?
             where "id" = ?`,
            [message, row.id],
          );
        }
      }
    });
  }
}
