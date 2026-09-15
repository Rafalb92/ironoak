import { useMutation, useQueryCache } from '@pinia/colada';
import {
  variantIdResultSchema,
  type UpdateVariantInput,
  type AdminProductDetail,
  type CreateVariantInput,
} from '@ironoak/contracts';
import { PRODUCT_QUERY_KEYS } from '../queries/products';


export function useAddVariant() {
  const cache = useQueryCache();
  const api = useApi();
  const toast = useToast();

  return useMutation({
    mutation: async ({ productId, input }: { productId: string; input: CreateVariantInput }) => {
      const raw = await api(`/admin/products/${productId}/variants`, {
        method: 'POST',
        body: input,
      });
      return variantIdResultSchema.parse(raw);
    },
    onSuccess: () => {
      toast.success('Variant added', 'Stock record will appear shortly.');
      cache.invalidateQueries({ key: PRODUCT_QUERY_KEYS.root });
    },
    onError: (error) => toast.error('Failed to add variant', error.message),
  });
}

export function useUpdateVariant() {
  const cache = useQueryCache();
  const api = useApi();
  const toast = useToast();

  return useMutation({
    mutation: async ({ id, input }: { id: string; input: UpdateVariantInput }) => {
      const raw = await api(`/admin/variants/${id}`, { method: 'PATCH', body: input });
      return variantIdResultSchema.parse(raw);
    },
    onSuccess: () => {
      toast.success('Variant updated');
      cache.invalidateQueries({ key: PRODUCT_QUERY_KEYS.root });
    },
    onError: (error) => toast.error('Failed to update variant', error.message),
  });
}

export function useSetStock(productId: Ref<string>) {
  const cache = useQueryCache();
  const api = useApi();
  const toast = useToast();

  return useMutation({
    mutation: ({ variantId, quantityOnHand }: { variantId: string; quantityOnHand: number }) =>
      api(`/admin/variants/${variantId}/stock`, {
        method: 'PATCH',
        body: { quantityOnHand },
      }),

    // --- OPTIMISTIC UPDATE ---
    onMutate: ({ variantId, quantityOnHand }) => {
      const key = PRODUCT_QUERY_KEYS.byId(productId.value);
      const previous = cache.getQueryData<AdminProductDetail>(key);
      if (!previous) return { previous };

      // podmień lokalnie, zanim serwer odpowie
      cache.setQueryData(key, {
        ...previous,
        variants: previous.variants.map((v) =>
          v.id === variantId && v.stock
            ? {
                ...v,
                stock: {
                  ...v.stock,
                  onHand: quantityOnHand,
                  available: quantityOnHand - v.stock.reserved,
                },
              }
            : v,
        ),
      });

      return { previous };
    },

    onError: (error, _vars, context) => {
      // cofnij podmianę — serwer odrzucił (np. poniżej rezerwacji)
      if (context?.previous) {
        cache.setQueryData(PRODUCT_QUERY_KEYS.byId(productId.value), context.previous);
      }
      toast.error('Failed to update stock', error.message);
    },

    onSettled: () => {
      // i tak odśwież z serwera — prawda jest tam
      cache.invalidateQueries({ key: PRODUCT_QUERY_KEYS.byId(productId.value) });
    },
  });
}
