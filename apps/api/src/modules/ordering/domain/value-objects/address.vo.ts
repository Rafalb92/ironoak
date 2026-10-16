import { InvalidAddressError } from '../errors/ordering.errors';

export interface AddressProps {
  recipientName?: string | null;
  phone?: string | null;
  street: string;
  buildingNumber: string;
  apartmentNumber?: string | null;
  city: string;
  postalCode: string;
  country: string;
}

export class Address {
  private constructor(
    public readonly recipientName: string | null,
    public readonly phone: string | null,
    public readonly street: string,
    public readonly buildingNumber: string,
    public readonly apartmentNumber: string | null,
    public readonly city: string,
    public readonly postalCode: string,
    public readonly country: string,
  ) {}

  /** New orders: everything a courier needs is required. */
  static of(props: AddressProps): Address {
    this.validate(props);
    return this.build(props);
  }

  /**
   * Stored orders: accepted as they are. Orders placed before recipient and
   * phone were collected must still load — validation belongs to creation.
   */
  static restore(props: AddressProps): Address {
    return this.build(props);
  }

  equals(other: Address): boolean {
    return (
      this.recipientName === other.recipientName &&
      this.phone === other.phone &&
      this.street === other.street &&
      this.buildingNumber === other.buildingNumber &&
      this.apartmentNumber === other.apartmentNumber &&
      this.city === other.city &&
      this.postalCode === other.postalCode &&
      this.country === other.country
    );
  }

  toString(): string {
    const apartment = this.apartmentNumber ? `/${this.apartmentNumber}` : '';
    const recipient = this.recipientName ? `${this.recipientName}, ` : '';
    return `${recipient}${this.street} ${this.buildingNumber}${apartment}, ${this.postalCode} ${this.city}, ${this.country}`;
  }

  private static build(props: AddressProps): Address {
    return new Address(
      props.recipientName?.trim() || null,
      props.phone?.trim() || null,
      props.street.trim(),
      props.buildingNumber.trim(),
      props.apartmentNumber?.trim() || null,
      props.city.trim(),
      props.postalCode.trim(),
      props.country.trim().toUpperCase(),
    );
  }

  private static validate(props: AddressProps): void {
    const required: [keyof AddressProps, string][] = [
      ['recipientName', 'Recipient name'],
      ['phone', 'Phone'],
      ['street', 'Street'],
      ['buildingNumber', 'Building number'],
      ['city', 'City'],
      ['postalCode', 'Postal code'],
      ['country', 'Country'],
    ];
    for (const [field, label] of required) {
      const value = props[field];
      if (typeof value !== 'string' || value.trim() === '') {
        throw new InvalidAddressError(`${label} is required`);
      }
    }
  }
}
