import { defineQueryOptions } from '@pinia/colada';
import { savedAddressListSchema } from '@ironoak/contracts';

export const ACCOUNT_QUERY_KEYS = {
  root: ['account'] as const,
  addresses: ['account', 'addresses'] as const,
};

export const savedAddressesQuery = defineQueryOptions({
  key: ACCOUNT_QUERY_KEYS.addresses,
  query: async () => savedAddressListSchema.parse(await useApi()('/me/addresses')),
  staleTime: 60_000,
});
