export interface PlaceOrderLineInput {
  productVariantId: string;
  quantity: number;
}

export interface PlaceOrderAddressInput {
  street: string;
  buildingNumber: string;
  apartmentNumber?: string;
  city: string;
  postalCode: string;
  country: string;
}

export class PlaceOrderCommand {
  constructor(
    public readonly customerId: string,
    public readonly lines: PlaceOrderLineInput[],
    public readonly deliveryAddress: PlaceOrderAddressInput,
  ) {}
}
