export const CatalogEventName = {
  VARIANT_CREATED: 'catalog.variant.created',
} as const;
export type CatalogEventName =
  (typeof CatalogEventName)[keyof typeof CatalogEventName];
