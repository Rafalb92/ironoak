import { defineEntity, type InferEntity, p } from '@mikro-orm/core';

// kształt jednej pozycji w JSONB (snapshot)
export interface OrderLineData {
  productVariantId: string;
  productName: string;
  unitPriceAmount: number; // grosze/centy
  quantity: number;
}

// kształt adresu w JSONB
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
    id: p.uuid().primary(), // UWAGA: bez defaultRaw — id generuje agregat
    customerId: p.uuid(),
    status: p.string(),
    totalAmount: p.integer(),
    currency: p.string(),
    deliveryAddress: p.json<AddressData>(),
    lines: p.json<OrderLineData[]>(),
    createdAt: p.datetime(),
    updatedAt: p.datetime(),
  },
});

export interface IOrderEntity extends InferEntity<typeof OrderEntitySchema> {}
