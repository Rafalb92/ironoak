import { defineQueryOptions } from '@pinia/colada';
import { adminOrderEmailListSchema } from '@ironoak/contracts';
import { ORDER_QUERY_KEYS } from './orders';

export const adminOrderEmailsQuery = defineQueryOptions((orderId: string) => ({
  // under the orders root: order actions invalidate it together with the order
  key: [...ORDER_QUERY_KEYS.root, 'emails', orderId],
  query: async () =>
    adminOrderEmailListSchema.parse(await useApi()(`/admin/orders/${orderId}/emails`)),
  staleTime: 0,
}));
