// packages/layer-admin/app/composables/useAdminProducts.ts
import { defineQuery, useQuery } from '@pinia/colada';
import { adminProductListQuery } from '../queries/products';

export const useAdminProducts = defineQuery(() => {
  const page = ref(1);
  const limit = ref(20);

  const query = useQuery(() => adminProductListQuery({ page: page.value, limit: limit.value }));

  const totalPages = computed(() =>
    query.data.value ? Math.ceil(query.data.value.total / limit.value) : 0,
  );

  return {
    ...query,
    page,
    limit,
    totalPages,
    nextPage: () => {
      if (page.value < totalPages.value) page.value++;
    },
    prevPage: () => {
      if (page.value > 1) page.value--;
    },
  };
});

