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
  describe('creation', () => {
    it('creates the order in PENDING_PAYMENT', () => {
      const order = anOrder();
      expect(order.status).toBe(OrderStatus.PENDING_PAYMENT);
    });

    it('rejects an order without lines', () => {
      expect(() =>
        Order.create({
          customerId: 'customer-1',
          lines: [],
          deliveryAddress: anAddress(),
          shippingMethod: aStandardShipping(),
        }),
      ).toThrow(EmptyOrderError);
    });

    it('computes the total as the sum of lines (1000 x 2 = 2000)', () => {
      const order = anOrder();
      expect(order.totalAmount.amount).toBe(2000);
    });

    it('computes the total from multiple lines', () => {
      const order = Order.create({
        customerId: 'customer-1',
        lines: [aLine(1000, 2), aLine(500, 3)], // 2000 + 1500
        deliveryAddress: anAddress(),
        shippingMethod: aStandardShipping(),
      });
      expect(order.totalAmount.amount).toBe(3500);
    });

    it('records an OrderPlaced event on creation', () => {
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

  describe('state machine — allowed transitions', () => {
    it('walks the full path: pending → paid → fulfilling → shipped → delivered', () => {
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

    it('confirmPayment records an order.paid event', () => {
      const order = anOrder();
      order.pullDomainEvents(); // wyczyść OrderPlaced
      order.confirmPayment();
      const events = order.pullDomainEvents();
      expect(events[0].eventName).toBe('order.paid');
    });
  });

  describe('state machine — FORBIDDEN transitions (invariants)', () => {
    it('cannot ship an unpaid order', () => {
      const order = anOrder(); // PENDING_PAYMENT
      expect(() => order.ship()).toThrow(InvalidOrderTransitionError);
    });

    it('cannot confirm payment twice', () => {
      const order = anOrder();
      order.confirmPayment();
      expect(() => order.confirmPayment()).toThrow();
    });

    it('cannot start fulfillment before payment', () => {
      const order = anOrder(); // PENDING_PAYMENT
      expect(() => order.startFulfillment()).toThrow();
    });

    it('cannot deliver an order that has not shipped', () => {
      const order = anOrder();
      order.confirmPayment();
      expect(() => order.markDelivered()).toThrow();
    });
  });

  describe('cancellation', () => {
    it('can cancel an order awaiting payment', () => {
      const order = anOrder();
      order.cancel('customer request');
      expect(order.status).toBe(OrderStatus.CANCELLED);
    });

    it('can cancel a paid order', () => {
      const order = anOrder();
      order.confirmPayment();
      order.cancel('out of stock');
      expect(order.status).toBe(OrderStatus.CANCELLED);
    });

    it('CANNOT cancel a delivered order', () => {
      const order = anOrder();
      order.confirmPayment();
      order.startFulfillment();
      order.ship();
      order.markDelivered();
      expect(() => order.cancel('too late')).toThrow();
    });

    it('cancellation records an event with the reason', () => {
      const order = anOrder();
      order.pullDomainEvents();
      order.cancel('customer request');
      const events = order.pullDomainEvents();
      expect(events[0].eventName).toBe('order.cancelled');
    });
  });
});
