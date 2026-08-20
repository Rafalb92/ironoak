import { defineEntity, type InferEntity, p } from '@mikro-orm/core';

export const PaymentEntitySchema = defineEntity({
  name: 'Payment',
  schema: 'payments',
  properties: {
    id: p.uuid().primary(), // UWAGA: bez defaultRaw — id generuje agregat
    orderId: p.uuid(),
    amount: p.integer(),
    currency: p.string(),
    status: p.string(),
    providerSessionId: p.string().nullable(),
    checkoutUrl: p.string().nullable(),
    createdAt: p.datetime(),
    updatedAt: p.datetime(),
  },
  indexes: [{ properties: ['orderId'] }, { properties: ['providerSessionId'] }],
});

export interface IPaymentEntity extends InferEntity<
  typeof PaymentEntitySchema
> {}
