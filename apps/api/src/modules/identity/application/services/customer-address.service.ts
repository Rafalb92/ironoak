import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import type {
  CreateSavedAddressInput,
  SavedAddress,
  UpdateSavedAddressInput,
} from '@ironoak/contracts';
import {
  CustomerAddressSchema,
  type ICustomerAddress,
} from '../../domain/customer-address.entity';

const MAX_ADDRESSES = 5;

/** Input shape: new entries always have recipient and phone, older ones may not. */
interface AddressInput {
  recipientName?: string | null;
  phone?: string | null;
  street: string;
  buildingNumber: string;
  apartmentNumber?: string | null;
  city: string;
  postalCode: string;
  country: string;
}

interface NormalizedAddress {
  recipientName: string | null;
  phone: string | null;
  street: string;
  buildingNumber: string;
  apartmentNumber: string | null;
  city: string;
  postalCode: string;
  country: string;
}

/**
 * Address book: plain CRUD with three rules — one default per customer,
 * a size limit, and no duplicates. No aggregate needed (ADR-0003).
 */
@Injectable()
export class CustomerAddressService {
  constructor(private readonly em: EntityManager) {}

  async list(userId: string): Promise<SavedAddress[]> {
    const addresses = await this.em.find(
      CustomerAddressSchema,
      { user: userId },
      // default first, then newest
      { orderBy: { isDefault: 'desc', createdAt: 'desc' } },
    );
    return addresses.map((address) => this.toDto(address));
  }

  async create(
    userId: string,
    input: CreateSavedAddressInput,
  ): Promise<SavedAddress> {
    const fields = this.normalize(input);
    const existing = await this.em.find(CustomerAddressSchema, {
      user: userId,
    });

    // saving the same address again (e.g. at every checkout) returns the existing one
    const duplicate = existing.find((address) =>
      this.sameAddress(address, fields),
    );
    if (duplicate) {
      if (input.isDefault && !duplicate.isDefault)
        await this.makeDefault(userId, duplicate);
      return this.toDto(duplicate);
    }

    if (existing.length >= MAX_ADDRESSES) {
      throw new ConflictException(
        `You can save up to ${MAX_ADDRESSES} addresses`,
      );
    }

    const address = this.em.create(CustomerAddressSchema, {
      user: userId,
      ...fields,
      isDefault: false,
    });

    // the first address is the default without asking
    if (existing.length === 0 || input.isDefault) {
      await this.makeDefault(userId, address);
    } else {
      await this.em.flush();
    }

    return this.toDto(address);
  }

  async update(
    userId: string,
    addressId: string,
    input: UpdateSavedAddressInput,
  ): Promise<SavedAddress> {
    const address = await this.findOwned(userId, addressId);
    const { isDefault, ...changes } = input;

    if (Object.keys(changes).length > 0) {
      this.em.assign(
        address,
        this.normalize({ ...this.fieldsOf(address), ...changes }),
      );
    }

    if (isDefault && !address.isDefault) {
      await this.makeDefault(userId, address);
    } else {
      await this.em.flush();
    }

    return this.toDto(address);
  }

  async remove(userId: string, addressId: string): Promise<void> {
    const address = await this.findOwned(userId, addressId);
    const wasDefault = address.isDefault;

    this.em.remove(address);
    await this.em.flush();

    // a book with addresses always has a default
    if (wasDefault) {
      const next = await this.em.findOne(
        CustomerAddressSchema,
        { user: userId },
        { orderBy: { createdAt: 'desc' } },
      );
      if (next) await this.makeDefault(userId, next);
    }
  }

  // --- helpers ---

  /**
   * Clears the old default with a direct UPDATE before setting the new one.
   * Both changes in a single flush could run in either order and trip the
   * one-default unique index halfway.
   */
  private async makeDefault(
    userId: string,
    address: ICustomerAddress,
  ): Promise<void> {
    await this.em.transactional(async (tx) => {
      await tx.nativeUpdate(
        CustomerAddressSchema,
        { user: userId, isDefault: true },
        { isDefault: false },
      );
      address.isDefault = true;
      tx.persist(address);
    });
  }

  private async findOwned(
    userId: string,
    addressId: string,
  ): Promise<ICustomerAddress> {
    // someone else's address is "not found" — its existence is not disclosed
    const address = await this.em.findOne(CustomerAddressSchema, {
      id: addressId,
      user: userId,
    });
    if (!address) throw new NotFoundException('Address not found');
    return address;
  }

  private normalize(input: AddressInput): NormalizedAddress {
    return {
      recipientName: input.recipientName?.trim() || null,
      phone: input.phone?.trim() || null,
      street: input.street.trim(),
      buildingNumber: input.buildingNumber.trim(),
      apartmentNumber: input.apartmentNumber?.trim() || null,
      city: input.city.trim(),
      postalCode: input.postalCode.trim(),
      country: input.country.trim().toUpperCase(),
    };
  }

  private fieldsOf(address: ICustomerAddress): AddressInput {
    return {
      recipientName: address.recipientName ?? null,
      phone: address.phone ?? null,
      street: address.street,
      buildingNumber: address.buildingNumber,
      apartmentNumber: address.apartmentNumber ?? null,
      city: address.city,
      postalCode: address.postalCode,
      country: address.country,
    };
  }

  /** The same place for a different person is a different entry. */
  private sameAddress(
    address: ICustomerAddress,
    fields: NormalizedAddress,
  ): boolean {
    const same = (a: string | null | undefined, b: string | null) =>
      (a ?? '').toLowerCase() === (b ?? '').toLowerCase();
    const digits = (value: string | null | undefined) =>
      (value ?? '').replace(/\D/g, '');

    return (
      same(address.recipientName, fields.recipientName) &&
      digits(address.phone) === digits(fields.phone) &&
      same(address.street, fields.street) &&
      same(address.buildingNumber, fields.buildingNumber) &&
      same(address.apartmentNumber, fields.apartmentNumber) &&
      same(address.city, fields.city) &&
      same(address.postalCode, fields.postalCode) &&
      same(address.country, fields.country)
    );
  }

  private toDto(address: ICustomerAddress): SavedAddress {
    return {
      id: address.id,
      recipientName: address.recipientName ?? null,
      phone: address.phone ?? null,
      street: address.street,
      buildingNumber: address.buildingNumber,
      apartmentNumber: address.apartmentNumber ?? null,
      city: address.city,
      postalCode: address.postalCode,
      country: address.country,
      isDefault: address.isDefault,
    };
  }
}
