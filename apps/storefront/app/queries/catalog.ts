import { defineQueryOptions } from '@pinia/colada';
import { productFacetsSchema } from '@ironoak/contracts';

export const productFacetsQuery = defineQueryOptions((category?: string) => ({
  key: ['products', 'facets', category ?? 'all'],
  query: async () =>
    productFacetsSchema.parse(
      await useApi()('/products/facets', { query: category ? { category } : {} }),
    ),
  // filter options change with the catalogue, not between clicks
  staleTime: 5 * 60_000,
}));
