import { defineQueryOptions } from '@pinia/colada';
import { shippingOptionListSchema } from '@ironoak/contracts';

export const shippingOptionsQuery = defineQueryOptions({
  key: ['checkout', 'shipping-options'],
  query: async () => shippingOptionListSchema.parse(await useApi()('/shipping-methods')),
  // options change with a deploy, not during a session
  staleTime: 10 * 60_000,
});
