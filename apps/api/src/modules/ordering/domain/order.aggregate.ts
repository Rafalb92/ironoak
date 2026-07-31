import { randomUUID } from 'node:crypto';
import { AggregateRoot } from '../../../shared-kernel/domain/aggregate-root.base';
import { Money } from './value-objects/money.vo';
import { Address } from './value-objects/address.vo';
import { OrderLine } from './value-objects/order-line.vo';
import { OrderPlacedEvent } from './events/order-placed.event';
import { OrderPaidEvent } from './events/order-paid.event';
import { OrderShippedEvent } from './events/order-shipped.event';
import { OrderCancelledEvent } from './events/order-cancelled.event';

export enum OrderStatus {
  PENDING_PAYMENT = 'PENDING_PAYMENT',
  PAID = 'PAID',
  FULFILLING = 'FULFILLING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

export interface CreateOrderProps {
  customerId: string;
  lines: OrderLine[];
  deliveryAddress: Address;
}

export class Order extends AggregateRoot {
  private _id!: string;
  private _customerId!: string;
  private _lines!: OrderLine[];
  private _status!: OrderStatus;
  private _totalAmount!: Money;
  private _deliveryAddress!: Address;
  private _createdAt!: Date;
  private _updatedAt!: Date;

  // prywatny — tworzenie tylko przez fabrykę create() lub restore()
  private constructor() {
    super();
  }

  // === TWORZENIE NOWEGO ZAMÓWIENIA ===
  static create(props: CreateOrderProps): Order {
    if (props.lines.length === 0) {
      throw new Error('Order must contain at least one line');
    }

    const order = new Order();
    order._id = randomUUID();
    order._customerId = props.customerId;
    order._lines = props.lines;
    order._deliveryAddress = props.deliveryAddress;
    order._status = OrderStatus.PENDING_PAYMENT;
    order._totalAmount = order.calculateTotal(); // LICZONY, nie podany
    order._createdAt = new Date();
    order._updatedAt = new Date();

    order.addDomainEvent(
      new OrderPlacedEvent(order._id, order._customerId, order._totalAmount),
    );

    return order;
  }

  // === ODTWORZENIE Z BAZY (bez zdarzeń, bez walidacji tworzenia) ===
  static restore(props: {
    id: string;
    customerId: string;
    lines: OrderLine[];
    status: OrderStatus;
    totalAmount: Money;
    deliveryAddress: Address;
    createdAt: Date;
    updatedAt: Date;
  }): Order {
    const order = new Order();
    order._id = props.id;
    order._customerId = props.customerId;
    order._lines = props.lines;
    order._status = props.status;
    order._totalAmount = props.totalAmount;
    order._deliveryAddress = props.deliveryAddress;
    order._createdAt = props.createdAt;
    order._updatedAt = props.updatedAt;
    return order;
  }

  // === METODY-PRZEJŚCIA (maszyna stanów) ===
  confirmPayment(): void {
    if (this._status !== OrderStatus.PENDING_PAYMENT) {
      throw new Error(
        `Cannot confirm payment for order in status ${this._status}`,
      );
    }
    this._status = OrderStatus.PAID;
    this.touch();
    this.addDomainEvent(new OrderPaidEvent(this._id));
  }

  startFulfillment(): void {
    if (this._status !== OrderStatus.PAID) {
      throw new Error(
        `Cannot start fulfillment for order in status ${this._status}`,
      );
    }
    this._status = OrderStatus.FULFILLING;
    this.touch();
  }

  ship(): void {
    if (this._status !== OrderStatus.FULFILLING) {
      throw new Error(`Cannot ship order in status ${this._status}`);
    }
    this._status = OrderStatus.SHIPPED;
    this.touch();
    this.addDomainEvent(new OrderShippedEvent(this._id));
  }

  markDelivered(): void {
    if (this._status !== OrderStatus.SHIPPED) {
      throw new Error(`Cannot deliver order in status ${this._status}`);
    }
    this._status = OrderStatus.DELIVERED;
    this.touch();
  }

  cancel(reason: string): void {
    const cancellable = [OrderStatus.PENDING_PAYMENT, OrderStatus.PAID];
    if (!cancellable.includes(this._status)) {
      throw new Error(`Cannot cancel order in status ${this._status}`);
    }
    this._status = OrderStatus.CANCELLED;
    this.touch();
    this.addDomainEvent(new OrderCancelledEvent(this._id, reason));
  }

  // === POMOCNICZE ===
  private calculateTotal(): Money {
    return this._lines.reduce(
      (sum, line) => sum.add(line.lineTotal),
      Money.of(0, 'USD'),
    );
  }

  private touch(): void {
    this._updatedAt = new Date();
  }

  // === GETTERY (tylko odczyt — brak setterów!) ===
  get id(): string {
    return this._id;
  }
  get customerId(): string {
    return this._customerId;
  }
  get lines(): readonly OrderLine[] {
    return this._lines;
  }
  get status(): OrderStatus {
    return this._status;
  }
  get totalAmount(): Money {
    return this._totalAmount;
  }
  get deliveryAddress(): Address {
    return this._deliveryAddress;
  }
  get createdAt(): Date {
    return this._createdAt;
  }
  get updatedAt(): Date {
    return this._updatedAt;
  }
}
