import { defineQueryOptions } from '@pinia/colada';
import { categorySchema } from '@ironoak/contracts';
import { z } from 'zod';

export const CATEGORY_QUERY_KEYS = {
  root: ['categories'] as const,
};

export const categoriesQuery = defineQueryOptions({
  key: CATEGORY_QUERY_KEYS.root,
  query: async () => {
    const raw = await useApi()('/categories');
    return z.array(categorySchema).parse(raw);
  },
  staleTime: 5 * 60_000, // kategorie zmieniają się rzadko
});
