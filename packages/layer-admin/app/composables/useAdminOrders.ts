import { defineQuery, useQuery } from '@pinia/colada';
import type { OrderStatus } from '@ironoak/contracts';
import { adminOrderListQuery } from '../queries/orders';
import {refDebounced} from '@vueuse/core';

export const useAdminOrders = defineQuery(() => {
  const page = ref(1);
  const limit = ref(20);
  const status = ref<OrderStatus | undefined>(undefined);
  const search = ref('');

  // debounce, żeby nie strzelać przy każdym znaku
  const debouncedSearch = refDebounced(search, 300);

  const query = useQuery(() =>
    adminOrderListQuery({
      page: page.value,
      limit: limit.value,
      status: status.value,
      search: debouncedSearch.value || undefined,
    }),
  );

  // zmiana filtra wraca na pierwszą stronę
  watch([status, debouncedSearch], () => {
    page.value = 1;
  });

  const totalPages = computed(() =>
    query.data.value ? Math.ceil(query.data.value.total / limit.value) : 0,
  );

  return {
    ...query,
    page,
    status,
    search,
    totalPages,
    nextPage: () => { if (page.value < totalPages.value) page.value++; },
    prevPage: () => { if (page.value > 1) page.value--; },
  };
});