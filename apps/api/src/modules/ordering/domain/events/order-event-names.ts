export const OrderEventName = {
  PLACED: 'order.placed',
  PAID: 'order.paid',
  FULFILLMENT_STARTED: 'order.fulfillment.started',
  SHIPPED: 'order.shipped',
  DELIVERED: 'order.delivered',
  CANCELLED: 'order.cancelled',
} as const;

export type OrderEventName =
  (typeof OrderEventName)[keyof typeof OrderEventName];
