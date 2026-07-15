import { Address } from './address.vo';

describe('Address', () => {
  describe('tworzenie', () => {
    it('tworzy poprawny adres', () => {
      const address = Address.of({
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

    it('odrzuca adres z brakującymi danymi', () => {
      expect(() =>
        Address.of({
          street: '',
          buildingNumber: '123',
          city: 'New York',
          postalCode: '10001',
          country: 'USA',
        }),
      ).toThrow();
    });

    it('akceptuje brak numeru mieszkania', () => {
      const address = Address.of({
        street: 'Main Street',
        buildingNumber: '123',
        city: 'New York',
        postalCode: '10001',
        country: 'USA',
      });
      expect(address.apartmentNumber).toBeNull();
    });
  });
});
