import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  EntityManager,
  UniqueConstraintViolationException,
} from '@mikro-orm/postgresql';
import { z } from 'zod';
import { InboxMessageEntity } from '../../../shared-infra/inbox/inbox-message.entity';
import { OrderEventName } from '../../ordering/domain/events/order-event-names';
import { ProductVariantSchema } from '../entities/product-variant.entity';

interface IntegrationEvent {
  eventId: string;
  aggregateId: string;
  aggregateType: string;
  occurredAt: Date;
  payload: Record<string, unknown>;
}

const orderPaidPayloadSchema = z.object({
  orderId: z.uuid(),
  lines: z
    .array(
      z.object({
        productVariantId: z.uuid(),
        quantity: z.number().int().positive(),
      }),
    )
    .min(1),
});

type OrderPaidLine = z.infer<typeof orderPaidPayloadSchema>['lines'][number];

// Atomic increment — safe under concurrent payments for the same product.
const INCREMENT_SALES_SQL = `
  insert into "catalog"."product_sales" ("product_id", "units_sold", "updated_at")
  values (?, ?, now())
  on conflict ("product_id") do update
  set "units_sold" = "catalog"."product_sales"."units_sold" + excluded."units_sold",
      "updated_at" = now()`;

@Injectable()
export class OrderPaidSalesListener {
  private readonly logger = new Logger(OrderPaidSalesListener.name);

  constructor(private readonly em: EntityManager) {}

  @OnEvent(OrderEventName.PAID, { promisify: true })
  async handle(event: IntegrationEvent): Promise<void> {
    const handlerName = OrderPaidSalesListener.name;
    const parsed = orderPaidPayloadSchema.safeParse(event.payload);
    const em = this.em.fork();

    try {
      await em.transactional(async (tx) => {
        tx.create(InboxMessageEntity, { eventId: event.eventId, handlerName });
        // claim the event first: a duplicate fails here, before any counter moves
        await tx.flush();

        if (!parsed.success) {
          // e.g. OrderPaid published before it carried lines — acknowledge, don't retry forever
          this.logger.warn(
            `Event ${event.eventId} has no usable lines, sales ranking not updated`,
          );
          return;
        }

        const unitsByProduct = await this.unitsByProduct(tx, parsed.data.lines);

        // tx.execute runs inside this transaction; a rollback also reverts the counters
        for (const [productId, units] of unitsByProduct) {
          await tx.execute(INCREMENT_SALES_SQL, [productId, units]);
        }
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

  /** Orders know variants; the ranking counts products. Catalog resolves the mapping itself. */
  private async unitsByProduct(
    tx: EntityManager,
    lines: OrderPaidLine[],
  ): Promise<Map<string, number>> {
    const variantIds = [...new Set(lines.map((line) => line.productVariantId))];
    const variants = await tx.find(
      ProductVariantSchema,
      { id: { $in: variantIds } },
      { fields: ['product'] },
    );
    const productByVariant = new Map(variants.map((v) => [v.id, v.product.id]));

    const units = new Map<string, number>();
    for (const line of lines) {
      const productId = productByVariant.get(line.productVariantId);
      if (!productId) continue; // variant removed since the order — nothing to rank
      units.set(productId, (units.get(productId) ?? 0) + line.quantity);
    }
    return units;
  }
}
