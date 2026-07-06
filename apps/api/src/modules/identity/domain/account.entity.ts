import { defineEntity, type InferEntity, p } from '@mikro-orm/core';
import { UserSchema } from './user.entity';

export const AccountSchema = defineEntity({
  name: 'Account',
  schema: 'identity',
  properties: {
    id: p.uuid().primary().defaultRaw('gen_random_uuid()'),
    user: () => p.manyToOne(UserSchema).deleteRule('cascade'),
    providerId: p.string(), // 'credential' | 'google' | 'github'
    accountId: p.string(), // id u providera; dla 'credential' = userId lub email
    password: p.string().nullable(), // tylko dla 'credential'
    accessToken: p.string().nullable(), // tylko dla OAuth
    refreshToken: p.string().nullable(), // tylko dla OAuth
    createdAt: p.datetime().onCreate(() => new Date()),
    updatedAt: p
      .datetime()
      .onCreate(() => new Date())
      .onUpdate(() => new Date()),
  },
});

export interface IAccount extends InferEntity<typeof AccountSchema> {}
