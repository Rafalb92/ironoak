import { defineEntity, type InferEntity, p } from '@mikro-orm/core';
import { AccountSchema } from './account.entity';

export const UserSchema = defineEntity({
  name: 'User',
  schema: 'identity',
  properties: {
    id: p.uuid().primary().defaultRaw('gen_random_uuid()'),
    email: p.string().unique(),
    emailVerified: p.boolean().default(false),
    accounts: p.oneToMany(AccountSchema).mappedBy('user').orphanRemoval(),
    createdAt: p.datetime().onCreate(() => new Date()),
    updatedAt: p
      .datetime()
      .onCreate(() => new Date())
      .onUpdate(() => new Date()),
  },
});

export interface IUser extends InferEntity<typeof UserSchema> {}
