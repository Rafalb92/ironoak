export const InventoryEventName = {
  STOCK_RESERVED: 'inventory.stock.reserved',
  STOCK_RESERVATION_FAILED: 'inventory.stock.reservation-failed',
  STOCK_RELEASED: 'inventory.stock.released',
  STOCK_SHIPPED: 'inventory.stock.shipped',
} as const;

export type InventoryEventName =
  (typeof InventoryEventName)[keyof typeof InventoryEventName];
