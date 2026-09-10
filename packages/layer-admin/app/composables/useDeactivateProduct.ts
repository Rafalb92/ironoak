import { PRODUCT_QUERY_KEYS } from "~/queries/products";

export function useDeactivateProduct() {
  const cache = useQueryCache();
  const api = useApi();

  return useMutation({
    mutation: (productId: string) => api(`/admin/products/${productId}`, { method: 'DELETE' }),
    onSettled: () => cache.invalidateQueries({ key: PRODUCT_QUERY_KEYS.root }),
  });
}
