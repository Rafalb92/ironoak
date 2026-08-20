import { Money } from './money.vo';

describe('Money', () => {
  describe('tworzenie', () => {
    it('tworzy poprawną kwotę', () => {
      const money = Money.of(1299, 'USD');
      expect(money.amount).toBe(1299);
      expect(money.currency).toBe('USD');
    });

    it('odrzuca kwotę ujemną', () => {
      expect(() => Money.of(-1, 'USD')).toThrow();
    });

    it('odrzuca kwotę niecałkowitą (ułamek grosza)', () => {
      expect(() => Money.of(10.5, 'USD')).toThrow();
    });

    it('akceptuje zero', () => {
      expect(Money.of(0, 'USD').amount).toBe(0);
    });
  });

  describe('operacje', () => {
    it('dodaje dwie kwoty', () => {
      const result = Money.of(1000, 'USD').add(Money.of(500, 'USD'));
      expect(result.amount).toBe(1500);
    });

    it('odejmuje kwoty', () => {
      const result = Money.of(1000, 'USD').subtract(Money.of(300, 'USD'));
      expect(result.amount).toBe(700);
    });

    it('odrzuca odejmowanie dające wynik ujemny', () => {
      expect(() =>
        Money.of(100, 'USD').subtract(Money.of(500, 'USD')),
      ).toThrow();
    });

    it('mnoży przez ilość', () => {
      const result = Money.of(1299, 'USD').multiply(3);
      expect(result.amount).toBe(3897);
    });

    it('porównuje kwoty', () => {
      expect(Money.of(100, 'USD').equals(Money.of(100, 'USD'))).toBe(true);
      expect(Money.of(100, 'USD').equals(Money.of(200, 'USD'))).toBe(false);
    });
  });

  describe('niezmienność', () => {
    it('add nie zmienia oryginału, tworzy nowy obiekt', () => {
      const original = Money.of(1000, 'USD');
      const result = original.add(Money.of(500, 'USD'));

      expect(original.amount).toBe(1000); // oryginał nietknięty
      expect(result.amount).toBe(1500); // nowy obiekt
      expect(result).not.toBe(original); // to różne instancje
    });
  });
});
