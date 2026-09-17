import { defineQueryOptions } from '@pinia/colada';
import {
  adminOrderListSchema,
  adminOrderDetailSchema,
  type AdminOrderQuery,
} from '@ironoak/contracts';

export const ORDER_QUERY_KEYS = {
  root: ['admin', 'orders'] as const,
  list: (query: AdminOrderQuery) => [...ORDER_QUERY_KEYS.root, 'list', query] as const,
  byId: (id: string) => [...ORDER_QUERY_KEYS.root, id] as const,
};

export const adminOrderListQuery = defineQueryOptions((query: AdminOrderQuery) => ({
  key: ORDER_QUERY_KEYS.list(query),
  query: async () => {
    const raw = await useApi()('/admin/orders', { query });
    return adminOrderListSchema.parse(raw);
  },
  staleTime: 15_000,
}));

export const adminOrderDetailQuery = defineQueryOptions((id: string) => ({
  key: ORDER_QUERY_KEYS.byId(id),
  query: async () => {
    const raw = await useApi()(`/admin/orders/${id}`);
    return adminOrderDetailSchema.parse(raw);
  },
  staleTime: 15_000,
}));
