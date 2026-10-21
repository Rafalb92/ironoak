import { defineQuery, useQuery, useMutation, useQueryCache } from '@pinia/colada';
import type { ChangeRoleInput } from '@ironoak/contracts';
import { adminUserListQuery, USER_QUERY_KEYS } from '../queries/users';
import { refDebounced } from '@vueuse/core';

export const useAdminUsers = defineQuery(() => {
  const page = ref(1);
  const limit = ref(20);
  const search = ref('');
  const debouncedSearch = refDebounced(search, 300);

  const query = useQuery(() =>
    adminUserListQuery({
      page: page.value,
      limit: limit.value,
      search: debouncedSearch.value || undefined,
    }),
  );

  watch(debouncedSearch, () => {
    page.value = 1;
  });

  const totalPages = computed(() =>
    query.data.value ? Math.ceil(query.data.value.total / limit.value) : 0,
  );

  return {
    ...query,
    page,
    search,
    totalPages,
    nextPage: () => {
      if (page.value < totalPages.value) page.value++;
    },
    prevPage: () => {
      if (page.value > 1) page.value--;
    },
  };
});

export function useChangeUserRole() {
  const cache = useQueryCache();
  const api = useApi();
  const toast = useToast();

  return useMutation({
    mutation: ({ userId, role }: { userId: string } & ChangeRoleInput) =>
      api(`/admin/users/${userId}/role`, { method: 'PATCH', body: { role } }),

    onSuccess: (_data, { role }) => {
      toast.success(
        `Role changed to ${role}`,
        'All their sessions were revoked — they will need to sign in again.',
      );
      cache.invalidateQueries({ key: USER_QUERY_KEYS.root });
    },

    onError: (error) => {
      const message =
        (error as { data?: { message?: string } })?.data?.message ?? 'Failed to change role';
      toast.error('Cannot change role', message);
    },
  });
}
