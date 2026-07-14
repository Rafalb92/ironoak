import { defineEntity, type InferEntity, p } from '@mikro-orm/core';

export const CategorySchema = defineEntity({
  name: 'Category',
  schema: 'catalog',
  properties: {
    id: p.uuid().primary().defaultRaw('gen_random_uuid()'),
    name: p.string(),
    slug: p.string().unique(),
    createdAt: p.datetime().onCreate(() => new Date()),
    updatedAt: p
      .datetime()
      .onCreate(() => new Date())
      .onUpdate(() => new Date()),
  },
});

export interface ICategory extends InferEntity<typeof CategorySchema> {}
