import { defineEntity, type InferEntity, p } from '@mikro-orm/core';
import { CategorySchema } from './category.entity';

export const ProductSchema = defineEntity({
  name: 'Product',
  schema: 'catalog',
  properties: {
    id: p.uuid().primary().defaultRaw('gen_random_uuid()'),
    name: p.string(),
    slug: p.string().unique(),
    description: p.text(),
    category: () => p.manyToOne(CategorySchema),
    // variants, images: USUNIĘTE — zrywają cykl
    active: p.boolean().default(true),
    createdAt: p.datetime().onCreate(() => new Date()),
    updatedAt: p
      .datetime()
      .onCreate(() => new Date())
      .onUpdate(() => new Date()),
  },
});

export interface IProduct extends InferEntity<typeof ProductSchema> {}
