import { defineQueryOptions } from '@pinia/colada';
import { adminUserListSchema, type AdminUserQuery } from '@ironoak/contracts';

export const USER_QUERY_KEYS = {
  root: ['admin', 'users'] as const,
  list: (query: AdminUserQuery) => [...USER_QUERY_KEYS.root, 'list', query] as const,
};

export const adminUserListQuery = defineQueryOptions((query: AdminUserQuery) => ({
  key: USER_QUERY_KEYS.list(query),
  query: async () => {
    const raw = await useApi()('/admin/users', { query });
    return adminUserListSchema.parse(raw);
  },
  staleTime: 30_000,
}));
