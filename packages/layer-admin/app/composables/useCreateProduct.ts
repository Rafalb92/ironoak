import { useMutation, useQueryCache } from '@pinia/colada';
import { productIdResultSchema, type CreateProductInput } from '@ironoak/contracts';
import { PRODUCT_QUERY_KEYS } from '../queries/products';

export function useCreateProduct() {
  const cache = useQueryCache();
  const api = useApi();

  return useMutation({
    mutation: async (input: CreateProductInput) => {
      const raw = await api('/admin/products', { method: 'POST', body: input });
      return productIdResultSchema.parse(raw);
    },
    onSuccess: () => cache.invalidateQueries({ key: PRODUCT_QUERY_KEYS.root }),
  });
}
