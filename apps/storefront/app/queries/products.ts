import { defineQueryOptions } from '@pinia/colada';
import { productListSchema, type ProductQuery } from '@ironoak/contracts';

type ProductListParams = Partial<ProductQuery>;

export const PRODUCT_QUERY_KEYS = {
  root: ['products'] as const,
  list: (params: ProductListParams) => [...PRODUCT_QUERY_KEYS.root, 'list', params] as const,
  bySlug: (slug: string) => [...PRODUCT_QUERY_KEYS.root, slug] as const,
};

export const productListQuery = defineQueryOptions((params: ProductListParams) => ({
  key: PRODUCT_QUERY_KEYS.list(params),
  query: async () => {
    const raw = await useApi()('/products', { query: params });
    return productListSchema.parse(raw);
  },
  staleTime: 5 * 60_000,
}));
