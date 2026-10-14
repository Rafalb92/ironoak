import { defineEntity, type InferEntity, p } from '@mikro-orm/core';

export const StockItemEntitySchema = defineEntity({
  name: 'StockItem',
  schema: 'inventory',
  properties: {
    id: p.uuid().primary(), // generuje agregat
    productVariantId: p.uuid().unique(), // jeden stan na wariant
    quantityOnHand: p.integer(),
    quantityReserved: p.integer(),
    updatedAt: p
      .datetime()
      .onCreate(() => new Date())
      .onUpdate(() => new Date()),
  },
  checks: [
    {
      name: 'stock_item_on_hand_non_negative',
      expression: 'quantity_on_hand >= 0',
    },
    {
      name: 'stock_item_reserved_non_negative',
      expression: 'quantity_reserved >= 0',
    },
    {
      name: 'stock_item_reserved_lte_on_hand',
      expression: 'quantity_reserved <= quantity_on_hand',
    },
  ],
});

export interface IStockItemEntity extends InferEntity<
  typeof StockItemEntitySchema
> {}
