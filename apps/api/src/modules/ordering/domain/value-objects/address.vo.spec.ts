import { Address } from './address.vo';
import { InvalidAddressError } from '../errors/ordering.errors';

const addressProps = () => ({
  recipientName: 'Jane Doe',
  phone: '+1 212 555 0100',
  street: 'Main Street',
  buildingNumber: '123',
  city: 'New York',
  postalCode: '10001',
  country: 'US',
});

describe('Address', () => {
  describe('creation', () => {
    it('creates a valid address', () => {
      const address = Address.of({
        recipientName: 'Jane Doe',
        phone: '+1 212 555 0100',
        street: 'Main Street',
        buildingNumber: '123',
        city: 'New York',
        postalCode: '10001',
        country: 'USA',
      });
      expect(address.street).toBe('Main Street');
      expect(address.buildingNumber).toBe('123');
      expect(address.city).toBe('New York');
      expect(address.postalCode).toBe('10001');
      expect(address.country).toBe('USA');
    });

    it('rejects an address with missing data', () => {
      expect(() =>
        Address.of({
          recipientName: 'Jane Doe',
          phone: '+1 212 555 0100',
          street: '',
          buildingNumber: '123',
          city: 'New York',
          postalCode: '10001',
          country: 'USA',
        }),
      ).toThrow();
    });

    it('accepts a missing apartment number', () => {
      const address = Address.of({
        recipientName: 'Jane Doe',
        phone: '+1 212 555 0100',
        street: 'Main Street',
        buildingNumber: '123',
        city: 'New York',
        postalCode: '10001',
        country: 'USA',
      });
      expect(address.apartmentNumber).toBeNull();
    });
  });

  describe('delivery address', () => {
    it('Address.of throws when recipientName is missing', () => {
      const { recipientName: _, ...props } = addressProps();
      expect(() => Address.of(props)).toThrow(
        new InvalidAddressError('Recipient name is required'),
      );
    });

    it('Address.of throws when phone is missing', () => {
      const { phone: _, ...props } = addressProps();
      expect(() => Address.of(props)).toThrow(
        new InvalidAddressError('Phone is required'),
      );
    });

    it('Address.restore accepts a stored address without recipientName and phone', () => {
      const { recipientName: _r, phone: _p, ...props } = addressProps();
      const address = Address.restore(props);
      expect(address.recipientName).toBeNull();
      expect(address.phone).toBeNull();
      expect(address.street).toBe('Main Street');
    });
  });
});
