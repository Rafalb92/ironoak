import { useMutation, useQueryCache } from '@pinia/colada';
import {
  imageIdResultSchema,
  type CreateImageInput,
  type UpdateImageInput,
} from '@ironoak/contracts';
import { PRODUCT_QUERY_KEYS } from '../queries/products';

export function useAddImage() {
  const cache = useQueryCache();
  const api = useApi();
  const toast = useToast();

  return useMutation({
    mutation: async ({ productId, input }: { productId: string; input: CreateImageInput }) => {
      const raw = await api(`/admin/products/${productId}/images`, {
        method: 'POST',
        body: input,
      });
      return imageIdResultSchema.parse(raw);
    },
    onSuccess: () => {
      toast.success('Image added');
      cache.invalidateQueries({ key: PRODUCT_QUERY_KEYS.root });
    },
    onError: (error) => toast.error('Failed to add image', error.message),
  });
}

export function useUpdateImage() {
  const cache = useQueryCache();
  const api = useApi();
  const toast = useToast();

  return useMutation({
    mutation: async ({ id, input }: { id: string; input: UpdateImageInput }) => {
      const raw = await api(`/admin/images/${id}`, { method: 'PATCH', body: input });
      return imageIdResultSchema.parse(raw);
    },
    onSuccess: () => cache.invalidateQueries({ key: PRODUCT_QUERY_KEYS.root }),
    onError: (error) => toast.error('Failed to update image', error.message),
  });
}

export function useRemoveImage() {
  const cache = useQueryCache();
  const api = useApi();
  const toast = useToast();

  return useMutation({
    mutation: (imageId: string) => api(`/admin/images/${imageId}`, { method: 'DELETE' }),
    onSuccess: () => {
      toast.success('Image removed');
      cache.invalidateQueries({ key: PRODUCT_QUERY_KEYS.root });
    },
    onError: (error) => toast.error('Failed to remove image', error.message),
  });
}
