import { defineEntity, type InferEntity, p } from '@mikro-orm/core';
import { ProductSchema } from './product.entity';
import { ProductVariantSchema } from './product-variant.entity';

/**
 * Holds images and — since ADR-0015's follow-up — one presentation video per
 * product. The name predates video support; renaming would touch every layer
 * for no functional gain.
 */
export const ProductImageSchema = defineEntity({
  name: 'ProductImage',
  schema: 'catalog',
  properties: {
    id: p.uuid().primary().defaultRaw('gen_random_uuid()'),
    product: () => p.manyToOne(ProductSchema),
    variant: () => p.manyToOne(ProductVariantSchema).nullable(),

    type: p.enum(['IMAGE', 'VIDEO']).default('IMAGE'),

    // exactly one source: an external URL or a key in object storage
    url: p.string().nullable(),
    storageKey: p.string().nullable(),
    // videos only: frame shown before playback
    posterKey: p.string().nullable(),

    alt: p.string(),
    role: p.string(), // 'HERO' | 'DETAIL' | 'LIFESTYLE'
    position: p.integer().default(0),
    createdAt: p.datetime().onCreate(() => new Date()),
  },
  indexes: [
    // at most one video per product — enforced by the database, not only the service,
    // so two concurrent uploads cannot both slip past the check
    {
      name: 'product_image_one_video_idx',
      expression: (columns, table, indexName) =>
        `create unique index "${indexName}" on "${table.schema}"."${table.name}" ("${columns.product}") where "${columns.type}" = 'VIDEO'`,
    },
  ],
});

export interface IProductImage extends InferEntity<typeof ProductImageSchema> {}
