import { defineEntity, type InferEntity, p } from '@mikro-orm/core';

/**
 * Read model: units sold per product, fed by OrderPaid events (ADR-0014).
 * Owned by Catalog — never written by Ordering, never read from ordering.* tables.
 * No relation to Product on purpose: avoids a reverse side and circular imports.
 */
export const ProductSalesSchema = defineEntity({
  name: 'ProductSales',
  schema: 'catalog',
  properties: {
    productId: p.uuid().primary(),
    unitsSold: p.integer().default(0),
    updatedAt: p
      .datetime()
      .onCreate(() => new Date())
      .onUpdate(() => new Date()),
  },
});

export interface IProductSales extends InferEntity<typeof ProductSalesSchema> {}
