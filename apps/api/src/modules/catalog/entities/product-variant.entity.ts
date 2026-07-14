import { defineEntity, type InferEntity, p } from '@mikro-orm/core';
import { ProductSchema } from './product.entity';

export const ProductVariantSchema = defineEntity({
  name: 'ProductVariant',
  schema: 'catalog',
  properties: {
    id: p.uuid().primary().defaultRaw('gen_random_uuid()'),
    product: () => p.manyToOne(ProductSchema),

    sku: p.string().unique(),
    name: p.string(), // np. "20kg / Cerakote Red"

    // cena w GROSZACH — integer, nigdy float
    price: p.integer(),

    // kolumny filtrowalne (indeksowalne, typowane)
    weightGrams: p.integer().nullable(),
    color: p.string().nullable(),
    material: p.string().nullable(),
    finish: p.string().nullable(),

    // reszta atrybutów — tylko do wyświetlenia, bez filtrowania
    attributes: p.json<Record<string, unknown>>().nullable(),

    active: p.boolean().default(true),
    createdAt: p.datetime().onCreate(() => new Date()),
    updatedAt: p
      .datetime()
      .onCreate(() => new Date())
      .onUpdate(() => new Date()),
  },
});

export interface IProductVariant extends InferEntity<
  typeof ProductVariantSchema
> {}
