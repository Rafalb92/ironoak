import { Order, OrderStatus } from './order.aggregate';
import { OrderLine } from './value-objects/order-line.vo';
import { Address } from './value-objects/address.vo';
import { Money } from './value-objects/money.vo';

// --- helpery: budują poprawne obiekty do testów (DRY) ---
const anAddress = () =>
  Address.of({
    street: 'Main Street',
    buildingNumber: '123',
    city: 'New York',
    postalCode: '10001',
    country: 'US',
  });

const aLine = (price = 1000, qty = 2) =>
  OrderLine.of({
    productVariantId: 'variant-1',
    productName: 'Atlas Rack',
    unitPrice: Money.of(price, 'USD'),
    quantity: qty,
  });

const anOrder = () =>
  Order.create({
    customerId: 'customer-1',
    lines: [aLine()],
    deliveryAddress: anAddress(),
  });

describe('Order aggregate', () => {
  describe('tworzenie', () => {
    it('tworzy zamówienie w stanie PENDING_PAYMENT', () => {
      const order = anOrder();
      expect(order.status).toBe(OrderStatus.PENDING_PAYMENT);
    });

    it('odrzuca zamówienie bez pozycji', () => {
      expect(() =>
        Order.create({
          customerId: 'customer-1',
          lines: [],
          deliveryAddress: anAddress(),
        }),
      ).toThrow();
    });

    it('liczy total jako sumę pozycji (1000 x 2 = 2000)', () => {
      const order = anOrder();
      expect(order.totalAmount.amount).toBe(2000);
    });

    it('liczy total z wielu pozycji', () => {
      const order = Order.create({
        customerId: 'customer-1',
        lines: [aLine(1000, 2), aLine(500, 3)], // 2000 + 1500
        deliveryAddress: anAddress(),
      });
      expect(order.totalAmount.amount).toBe(3500);
    });

    it('rejestruje zdarzenie OrderPlaced przy utworzeniu', () => {
      const order = anOrder();
      const events = order.pullDomainEvents();
      expect(events).toHaveLength(1);
      expect(events[0].eventName).toBe('order.placed');
    });
  });

  describe('maszyna stanów — przejścia dozwolone', () => {
    it('przechodzi pełną ścieżkę: pending → paid → fulfilling → shipped → delivered', () => {
      const order = anOrder();
      order.confirmPayment();
      expect(order.status).toBe(OrderStatus.PAID);
      order.startFulfillment();
      expect(order.status).toBe(OrderStatus.FULFILLING);
      order.ship();
      expect(order.status).toBe(OrderStatus.SHIPPED);
      order.markDelivered();
      expect(order.status).toBe(OrderStatus.DELIVERED);
    });

    it('confirmPayment rejestruje zdarzenie order.paid', () => {
      const order = anOrder();
      order.pullDomainEvents(); // wyczyść OrderPlaced
      order.confirmPayment();
      const events = order.pullDomainEvents();
      expect(events[0].eventName).toBe('order.paid');
    });
  });

  describe('maszyna stanów — przejścia ZAKAZANE (niezmienniki)', () => {
    it('nie można wysłać niezapłaconego zamówienia', () => {
      const order = anOrder(); // PENDING_PAYMENT
      expect(() => order.ship()).toThrow();
    });

    it('nie można potwierdzić płatności dwa razy', () => {
      const order = anOrder();
      order.confirmPayment();
      expect(() => order.confirmPayment()).toThrow();
    });

    it('nie można rozpocząć realizacji bez opłacenia', () => {
      const order = anOrder(); // PENDING_PAYMENT
      expect(() => order.startFulfillment()).toThrow();
    });

    it('nie można dostarczyć niewysłanego', () => {
      const order = anOrder();
      order.confirmPayment();
      expect(() => order.markDelivered()).toThrow();
    });
  });

  describe('anulowanie', () => {
    it('można anulować zamówienie oczekujące na płatność', () => {
      const order = anOrder();
      order.cancel('customer request');
      expect(order.status).toBe(OrderStatus.CANCELLED);
    });

    it('można anulować zamówienie opłacone', () => {
      const order = anOrder();
      order.confirmPayment();
      order.cancel('out of stock');
      expect(order.status).toBe(OrderStatus.CANCELLED);
    });

    it('NIE można anulować dostarczonego zamówienia', () => {
      const order = anOrder();
      order.confirmPayment();
      order.startFulfillment();
      order.ship();
      order.markDelivered();
      expect(() => order.cancel('too late')).toThrow();
    });

    it('anulowanie rejestruje zdarzenie z powodem', () => {
      const order = anOrder();
      order.pullDomainEvents();
      order.cancel('customer request');
      const events = order.pullDomainEvents();
      expect(events[0].eventName).toBe('order.cancelled');
    });
  });
});
