import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EntityManager } from '@mikro-orm/postgresql';

const RETENTION_DAYS = 30;

@Injectable()
export class OutboxCleanupService {
  private readonly logger = new Logger(OutboxCleanupService.name);

  constructor(private readonly em: EntityManager) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async cleanup(): Promise<void> {
    const em = this.em.fork();

    // --- outbox ---
    await em.getConnection().execute(
      `delete from "outbox"."outbox_message"
       where "processed_at" is not null
         and "processed_at" < now() - interval '${RETENTION_DAYS} days'`,
    );

    // --- inbox ---
    await em.getConnection().execute(
      `delete from "inbox"."inbox_message"
       where "processed_at" < now() - interval '${RETENTION_DAYS} days'`,
    );

    this.logger.log(
      `Cleaned up outbox and inbox entries older than ${RETENTION_DAYS} days`,
    );
  }
}
