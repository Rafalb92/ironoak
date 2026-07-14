import { defineEntity, type InferEntity, p } from '@mikro-orm/core';
import { ProductSchema } from './product.entity';
import { ProductVariantSchema } from './product-variant.entity';

export const ProductImageSchema = defineEntity({
  name: 'ProductImage',
  schema: 'catalog',
  properties: {
    id: p.uuid().primary().defaultRaw('gen_random_uuid()'),
    product: () => p.manyToOne(ProductSchema),
    variant: () => p.manyToOne(ProductVariantSchema).nullable(),

    url: p.string(),
    alt: p.string(),
    role: p.string(), // 'HERO' | 'DETAIL' | 'LIFESTYLE'
    position: p.integer().default(0),
    createdAt: p.datetime().onCreate(() => new Date()),
  },
});

export interface IProductImage extends InferEntity<typeof ProductImageSchema> {}
