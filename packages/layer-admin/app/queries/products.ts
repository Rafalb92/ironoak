// packages/layer-admin/app/queries/products.ts
import { defineQueryOptions } from '@pinia/colada';
import type { AdminProductList } from '@ironoak/contracts';

export const PRODUCT_QUERY_KEYS = {
  root: ['admin', 'products'] as const,
  list: (page: number, limit: number) =>
    [...PRODUCT_QUERY_KEYS.root, 'list', { page, limit }] as const,
  byId: (id: string) => [...PRODUCT_QUERY_KEYS.root, id] as const,
};

export const adminProductListQuery = defineQueryOptions(
  ({ page, limit }: { page: number; limit: number }) => ({
    key: PRODUCT_QUERY_KEYS.list(page, limit),
    query: () => useApi()<AdminProductList>('/admin/products', { query: { page, limit } }),
    staleTime: 30_000,
  }),
);
