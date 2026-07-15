export interface AddressProps {
  street: string;
  buildingNumber: string;
  apartmentNumber?: string;
  city: string;
  postalCode: string;
  country: string;
}

export class Address {
  private constructor(
    public readonly street: string,
    public readonly buildingNumber: string,
    public readonly apartmentNumber: string | null,
    public readonly city: string,
    public readonly postalCode: string,
    public readonly country: string,
  ) {}

  static of(props: AddressProps): Address {
    this.validate(props);
    return new Address(
      props.street.trim(),
      props.buildingNumber.trim(),
      props.apartmentNumber?.trim() ?? null,
      props.city.trim(),
      props.postalCode.trim(),
      props.country.trim().toUpperCase(),
    );
  }

  equals(other: Address): boolean {
    return (
      this.street === other.street &&
      this.buildingNumber === other.buildingNumber &&
      this.apartmentNumber === other.apartmentNumber &&
      this.city === other.city &&
      this.postalCode === other.postalCode &&
      this.country === other.country
    );
  }

  toString(): string {
    const apt = this.apartmentNumber ? `/${this.apartmentNumber}` : '';
    return `${this.street} ${this.buildingNumber}${apt}, ${this.postalCode} ${this.city}, ${this.country}`;
  }

  private static validate(props: AddressProps): void {
    const required: [keyof AddressProps, string][] = [
      ['street', 'Street'],
      ['buildingNumber', 'Building number'],
      ['city', 'City'],
      ['postalCode', 'Postal code'],
      ['country', 'Country'],
    ];
    for (const [field, label] of required) {
      const value = props[field];
      if (!value || value.trim() === '') {
        throw new Error(`${label} is required`);
      }
    }
  }
}
