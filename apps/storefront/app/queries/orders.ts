import { defineQueryOptions } from '@pinia/colada';
import { orderDetailSchema } from '@ironoak/contracts';

export const ORDER_QUERY_KEYS = {
  root: ['orders'] as const,
  detail: (id: string) => [...ORDER_QUERY_KEYS.root, 'detail', id] as const,
};

export const orderDetailQuery = defineQueryOptions((id: string) => ({
  key: ORDER_QUERY_KEYS.detail(id),
  query: async () => orderDetailSchema.parse(await useApi()(`/orders/${id}`)),
  // status changes on the server (webhook) — never serve a cached one
  staleTime: 0,
}));
