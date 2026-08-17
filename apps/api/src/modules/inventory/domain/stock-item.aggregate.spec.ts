import { StockItem } from './stock-item.aggregate';
import {
  InsufficientStockError,
  InvalidStockQuantityError,
} from './errors/inventory.errors';

const anItem = (onHand = 10) =>
  StockItem.create({ productVariantId: 'variant-1', quantityOnHand: onHand });

describe('StockItem', () => {
  describe('tworzenie', () => {
    it('tworzy pozycję z zerową rezerwacją', () => {
      const item = anItem(10);
      expect(item.quantityOnHand).toBe(10);
      expect(item.quantityReserved).toBe(0);
      expect(item.availableQuantity).toBe(10);
    });

    it('odrzuca ujemną ilość', () => {
      expect(() =>
        StockItem.create({ productVariantId: 'v', quantityOnHand: -1 }),
      ).toThrow(InvalidStockQuantityError);
    });
  });

  describe('rezerwacja', () => {
    it('rezerwuje dostępny towar', () => {
      const item = anItem(10);
      item.reserve(3);
      expect(item.quantityReserved).toBe(3);
      expect(item.quantityOnHand).toBe(10); // fizycznie wciąż na półce
      expect(item.availableQuantity).toBe(7);
    });

    it('nie rezerwuje więcej niż dostępne', () => {
      const item = anItem(5);
      expect(() => item.reserve(6)).toThrow(InsufficientStockError);
    });

    it('nie rezerwuje ponad to, co już zarezerwowane', () => {
      const item = anItem(10);
      item.reserve(8);
      expect(() => item.reserve(3)).toThrow(InsufficientStockError);
    });

    it('pozwala zarezerwować dokładnie tyle, ile dostępne', () => {
      const item = anItem(5);
      item.reserve(5);
      expect(item.availableQuantity).toBe(0);
    });
  });

  describe('zwalnianie', () => {
    it('zwalnia rezerwację', () => {
      const item = anItem(10);
      item.reserve(4);
      item.release(4);
      expect(item.quantityReserved).toBe(0);
      expect(item.availableQuantity).toBe(10);
    });

    it('nie zwalnia więcej niż zarezerwowane', () => {
      const item = anItem(10);
      item.reserve(2);
      expect(() => item.release(3)).toThrow(InvalidStockQuantityError);
    });
  });

  describe('wysyłka', () => {
    it('zdejmuje towar z półki i zwalnia rezerwację', () => {
      const item = anItem(10);
      item.reserve(3);
      item.ship(3);
      expect(item.quantityOnHand).toBe(7); // zniknęło z magazynu
      expect(item.quantityReserved).toBe(0); // rezerwacja zmaterializowana
      expect(item.availableQuantity).toBe(7);
    });

    it('nie wysyła niezarezerwowanego towaru', () => {
      const item = anItem(10);
      expect(() => item.ship(1)).toThrow(InvalidStockQuantityError);
    });
  });

  describe('uzupełnianie', () => {
    it('zwiększa stan i dostępność', () => {
      const item = anItem(5);
      item.reserve(2);
      item.restock(10);
      expect(item.quantityOnHand).toBe(15);
      expect(item.availableQuantity).toBe(13);
    });
  });

  describe('niezmiennik available', () => {
    it('available zawsze równa się onHand minus reserved', () => {
      const item = anItem(20);
      item.reserve(5);
      item.ship(2);
      item.restock(3);
      expect(item.availableQuantity).toBe(
        item.quantityOnHand - item.quantityReserved,
      );
    });
  });
});
