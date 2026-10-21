import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { EntityManager } from '@mikro-orm/postgresql';

const DEMO_AVAILABLE_FLOOR = 25;

// raises stock so that at least FLOOR units are free; reservations are never touched
const RESTOCK_SQL = `
  update "inventory"."stock_item"
  set "quantity_on_hand" = greatest("quantity_on_hand", "quantity_reserved" + ?),
      "updated_at" = now()
  where "quantity_on_hand" - "quantity_reserved" < ?
  returning "id"`;

/**
 * Public demo only (DEMO_MODE=true): every visitor buys something, and a
 * sold-out catalogue would greet the next one. Each night, available stock is
 * brought back to a floor — without touching reservations or orders.
 */
@Injectable()
export class DemoRestockJob {
  private readonly logger = new Logger(DemoRestockJob.name);
  private readonly enabled: boolean;

  constructor(
    private readonly em: EntityManager,
    config: ConfigService,
  ) {
    this.enabled = config.get<string>('DEMO_MODE') === 'true';
  }

  @Cron('0 3 * * *', { name: 'demo-restock', timeZone: 'UTC' })
  async restock(): Promise<void> {
    if (!this.enabled) return;

    // `returning` gives back the updated rows — their count is the number restocked
    const restocked = await this.em
      .fork()
      .getConnection()
      .execute<
        { id: string }[]
      >(RESTOCK_SQL, [DEMO_AVAILABLE_FLOOR, DEMO_AVAILABLE_FLOOR]);

    this.logger.log(`Demo restock: ${restocked.length} stock items topped up`);
  }
}
