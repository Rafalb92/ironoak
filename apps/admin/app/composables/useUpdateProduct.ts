import { useMutation, useQueryCache } from '@pinia/colada';
import { productIdResultSchema, type UpdateProductInput } from '@ironoak/contracts';
import { PRODUCT_QUERY_KEYS } from '../queries/products';

export function useUpdateProduct() {
  const cache = useQueryCache();
  const api = useApi();
const toast = useToast();

  return useMutation({
    mutation: async ({ id, input }: { id: string; input: UpdateProductInput }) => {
      const raw = await api(`/admin/products/${id}`, { method: 'PATCH', body: input });
      return productIdResultSchema.parse(raw);
    },
    onSuccess: () => {
      toast.success('Product updated');
      cache.invalidateQueries({ key: PRODUCT_QUERY_KEYS.root });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}
