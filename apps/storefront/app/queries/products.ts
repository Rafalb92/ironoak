import { defineQueryOptions } from '@pinia/colada';
import { productDetailSchema, productListSchema, type ProductQuery } from '@ironoak/contracts';

type ProductListParams = Partial<ProductQuery>;

export const PRODUCT_QUERY_KEYS = {
  root: ['products'] as const,
  list: (params: ProductListParams) => [...PRODUCT_QUERY_KEYS.root, 'list', params] as const,
  // 'detail' segment: a product slugged "list" must not collide with list keys
  bySlug: (slug: string) => [...PRODUCT_QUERY_KEYS.root, 'detail', slug] as const,
};

export const productListQuery = defineQueryOptions((params: ProductListParams) => ({
  key: PRODUCT_QUERY_KEYS.list(params),
  query: async () => {
    const raw = await useApi()('/products', { query: params });
    return productListSchema.parse(raw);
  },
  staleTime: 5 * 60_000,
}));

export const productDetailQuery = defineQueryOptions((slug: string) => ({
  key: PRODUCT_QUERY_KEYS.bySlug(slug),
  query: async () => {
    const raw = await useApi()(`/products/${slug}`);
    return productDetailSchema.parse(raw);
  },
  staleTime: 60_000,
}));
