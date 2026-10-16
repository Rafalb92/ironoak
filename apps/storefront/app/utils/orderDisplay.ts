import type { OrderStatus } from '@ironoak/contracts';

/** Customer-facing wording and colour for each status — one place for the whole storefront. */
export const ORDER_STATUS_DISPLAY: Record<OrderStatus, { label: string; tone: string }> = {
  PENDING_PAYMENT: { label: 'Awaiting payment', tone: 'bg-brass/15 text-fg' },
  PAID: { label: 'Paid', tone: 'bg-moss/15 text-moss' },
  FULFILLING: { label: 'Preparing', tone: 'bg-moss/15 text-moss' },
  SHIPPED: { label: 'On its way', tone: 'bg-moss/15 text-moss' },
  DELIVERED: { label: 'Delivered', tone: 'bg-surface text-fg-muted' },
  CANCELLED: { label: 'Cancelled', tone: 'bg-rust/10 text-rust' },
};

/** "A1B2C3D4" — what the customer reads and quotes to support. */
export function shortOrderId(id: string): string {
  return id.slice(0, 8).toUpperCase();
}

const dateFormatter = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' });

export function formatOrderDate(date: Date): string {
  return dateFormatter.format(date);
}
