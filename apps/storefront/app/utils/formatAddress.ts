interface AddressLike {
  street: string;
  buildingNumber: string;
  apartmentNumber?: string | null;
  city: string;
  postalCode: string;
  country: string;
}

/** Two display lines: "Main Street 123/4B" and "10001 New York, United States". */
export function addressLines(address: AddressLike): [string, string] {
  const apartment = address.apartmentNumber ? `/${address.apartmentNumber}` : '';
  return [
    `${address.street} ${address.buildingNumber}${apartment}`,
    `${address.postalCode} ${address.city}, ${countryName(address.country)}`,
  ];
}
