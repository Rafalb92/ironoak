import { useQuery, useQueryCache } from '@pinia/colada';
import {
  savedAddressSchema,
  type CreateSavedAddressInput,
  type SavedAddress,
  type UpdateSavedAddressInput,
} from '@ironoak/contracts';
import { ACCOUNT_QUERY_KEYS, savedAddressesQuery } from '../queries/account';

// same limit the API enforces
export const ADDRESS_BOOK_LIMIT = 5;

/** Read and change the signed-in customer's address book. */
export function useAddressBook() {
  const api = useApi();
  const cache = useQueryCache();

  const query = useQuery(savedAddressesQuery);
  const addresses = computed(() => query.data.value ?? []);

  // default flags move between entries, so the whole list is refetched after any change
  const refresh = () => cache.invalidateQueries({ key: ACCOUNT_QUERY_KEYS.addresses });

  async function create(input: CreateSavedAddressInput): Promise<SavedAddress> {
    const saved = savedAddressSchema.parse(
      await api('/me/addresses', { method: 'POST', body: input }),
    );
    await refresh();
    return saved;
  }

  async function update(id: string, input: UpdateSavedAddressInput): Promise<SavedAddress> {
    const saved = savedAddressSchema.parse(
      await api(`/me/addresses/${id}`, { method: 'PATCH', body: input }),
    );
    await refresh();
    return saved;
  }

  async function makeDefault(id: string): Promise<void> {
    await update(id, { isDefault: true });
  }

  async function remove(id: string): Promise<void> {
    await api(`/me/addresses/${id}`, { method: 'DELETE' });
    await refresh();
  }

  return { query, addresses, create, update, makeDefault, remove };
}
