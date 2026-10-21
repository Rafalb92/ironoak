import { PRODUCT_QUERY_KEYS } from "~/queries/products";

export function useDeactivateProduct() {
  const cache = useQueryCache();
  const api = useApi();

  return useMutation({
    // explicit response type: inferring it from Nuxt's typed routes exceeds the type depth limit
    mutation: (productId: string) => api<unknown>(`/admin/products/${productId}`, { method: 'DELETE' }),
    onSettled: () => cache.invalidateQueries({ key: PRODUCT_QUERY_KEYS.root }),
  });
}
