import { defineEntity, type InferEntity, p } from '@mikro-orm/core';
import { UserSchema } from './user.entity';

/**
 * A customer's address book entry. Orders never reference it — they copy the
 * address at purchase time, so editing the book never rewrites order history.
 */
export const CustomerAddressSchema = defineEntity({
  name: 'CustomerAddress',
  schema: 'identity',
  properties: {
    id: p.uuid().primary().defaultRaw('gen_random_uuid()'),
    user: () => p.manyToOne(UserSchema).deleteRule('cascade'),

    street: p.string(),
    buildingNumber: p.string(),
    apartmentNumber: p.string().nullable(),
    city: p.string(),
    postalCode: p.string(),
    country: p.string(), // ISO 3166-1 alpha-2

    isDefault: p.boolean().default(false),

    createdAt: p.datetime().onCreate(() => new Date()),
    updatedAt: p
      .datetime()
      .onCreate(() => new Date())
      .onUpdate(() => new Date()),
  },
  indexes: [
    { properties: ['user'] },
    // exactly one default per customer — enforced by the database, not only the service
    {
      name: 'customer_address_one_default_idx',
      expression: (columns, table, indexName) =>
        `create unique index "${indexName}" on "${table.schema}"."${table.name}" ("${columns.user}") where "${columns.isDefault}" = true`,
    },
  ],
});

export interface ICustomerAddress extends InferEntity<
  typeof CustomerAddressSchema
> {}
