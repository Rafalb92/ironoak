import { defineEntity, type InferEntity, p } from '@mikro-orm/core';

export const UserSchema = defineEntity({
  name: 'User',
  schema: 'identity',
  properties: {
    id: p.uuid().primary().defaultRaw('gen_random_uuid()'),
    email: p.string().unique(),
    emailVerified: p.boolean().default(false),
    createdAt: p.datetime().onCreate(() => new Date()),
    updatedAt: p
      .datetime()
      .onCreate(() => new Date())
      .onUpdate(() => new Date()),
  },
});

export interface IUser extends InferEntity<typeof UserSchema> {}
