import { Order, OrderStatus } from './order.aggregate';
import { OrderLine } from './value-objects/order-line.vo';
import { Address } from './value-objects/address.vo';
import { ShippingMethod } from './value-objects/shipping-method.vo';
import { Money } from '../../../shared-kernel/domain/value-objects/money.vo';
import {
  EmptyOrderError,
  InvalidAddressError,
  InvalidOrderTransitionError,
} from './errors/ordering.errors';

// --- helpery: budują poprawne obiekty do testów (DRY) ---
const addressProps = () => ({
  recipientName: 'Jane Doe',
  phone: '+1 212 555 0100',
  street: 'Main Street',
  buildingNumber: '123',
  city: 'New York',
  postalCode: '10001',
  country: 'US',
});

const anAddress = () => Address.of(addressProps());

const aLine = (price = 1000, qty = 2) =>
  OrderLine.of({
    productVariantId: 'variant-1',
    productName: 'Atlas Rack',
    unitPrice: Money.of(price, 'USD'),
    quantity: qty,
  });

const aStandardShipping = () => ShippingMethod.of('STANDARD');

const anOrder = () =>
  Order.create({
    customerId: 'customer-1',
    lines: [aLine()],
    deliveryAddress: anAddress(),
    shippingMethod: aStandardShipping(),
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
          shippingMethod: aStandardShipping(),
        }),
      ).toThrow(EmptyOrderError);
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
        shippingMethod: aStandardShipping(),
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

  describe('shipping', () => {
    it('adds the shipping cost to the sum of line totals', () => {
      const order = Order.create({
        customerId: 'customer-1',
        lines: [aLine(1000, 2), aLine(500, 3)], // 2000 + 1500
        deliveryAddress: anAddress(),
        shippingMethod: ShippingMethod.of('WHITE_GLOVE'),
      });
      expect(order.subtotal.amount).toBe(3500);
      expect(order.shippingMethodCode).toBe('WHITE_GLOVE');
      expect(order.shippingCost.amount).toBe(14900);
      expect(order.totalAmount.amount).toBe(3500 + 14900);
    });

    it('keeps the stored shipping cost when restoring an order (snapshot)', () => {
      // placed when white-glove delivery cost 9900, before the price changed
      const order = Order.restore({
        id: 'order-1',
        customerId: 'customer-1',
        lines: [aLine(1000, 2)],
        status: OrderStatus.PAID,
        deliveryAddress: anAddress(),
        shippingMethodCode: 'WHITE_GLOVE',
        shippingCost: Money.of(9900, 'USD'),
        totalAmount: Money.of(2000 + 9900, 'USD'),
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01'),
      });
      expect(order.shippingCost.amount).toBe(9900);
      expect(order.shippingCost.amount).not.toBe(
        ShippingMethod.of('WHITE_GLOVE').price.amount,
      );
      expect(order.totalAmount.amount).toBe(11900);
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
      expect(() => order.ship()).toThrow(InvalidOrderTransitionError);
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
