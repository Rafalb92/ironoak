import { defineEntity, type InferEntity, p } from '@mikro-orm/core';

// shape of one line in JSONB (snapshot)
export interface OrderLineData {
  productVariantId: string;
  productName: string;
  unitPriceAmount: number; // cents
  quantity: number;
}

// shape of the address in JSONB
export interface AddressData {
  street: string;
  buildingNumber: string;
  apartmentNumber: string | null;
  city: string;
  postalCode: string;
  country: string;
}

export const OrderEntitySchema = defineEntity({
  name: 'Order',
  schema: 'ordering',
  properties: {
    id: p.uuid().primary(), // NOTE: no defaultRaw — the aggregate generates the id
    customerId: p.uuid(),
    status: p.string(),
    // defaults back-fill orders placed before delivery options existed: delivery was free
    shippingMethod: p.string().default('STANDARD'),
    shippingAmount: p.integer().default(0),
    totalAmount: p.integer(),
    currency: p.string(),
    deliveryAddress: p.json<AddressData>(),
    lines: p.json<OrderLineData[]>(),
    createdAt: p.datetime(),
    updatedAt: p.datetime(),
  },
});

export interface IOrderEntity extends InferEntity<typeof OrderEntitySchema> {}
