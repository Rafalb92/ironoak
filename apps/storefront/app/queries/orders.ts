import { defineQueryOptions } from '@pinia/colada';
import { orderDetailSchema, orderSummaryListSchema } from '@ironoak/contracts';

export const ORDER_QUERY_KEYS = {
  root: ['orders'] as const,
  mine: ['orders', 'mine'] as const,
  detail: (id: string) => [...ORDER_QUERY_KEYS.root, 'detail', id] as const,
};

export const myOrdersQuery = defineQueryOptions({
  key: ORDER_QUERY_KEYS.mine,
  query: async () => orderSummaryListSchema.parse(await useApi()('/orders')),
  staleTime: 30_000,
});

export const orderDetailQuery = defineQueryOptions((id: string) => ({
  key: ORDER_QUERY_KEYS.detail(id),
  query: async () => orderDetailSchema.parse(await useApi()(`/orders/${id}`)),
  // status changes on the server (webhook, admin) — never serve a cached one
  staleTime: 0,
}));
