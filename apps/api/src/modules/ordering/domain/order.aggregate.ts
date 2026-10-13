import { randomUUID } from 'node:crypto';
import { AggregateRoot } from '../../../shared-kernel/domain/aggregate-root.base';
import { Money } from '../../../shared-kernel/domain/value-objects/money.vo';
import { Address } from './value-objects/address.vo';
import { OrderLine } from './value-objects/order-line.vo';
import { ShippingMethod } from './value-objects/shipping-method.vo';
import { OrderPlacedEvent } from './events/order-placed.event';
import { OrderPaidEvent } from './events/order-paid.event';
import { OrderShippedEvent } from './events/order-shipped.event';
import { OrderCancelledEvent } from './events/order-cancelled.event';
import {
  EmptyOrderError,
  InvalidOrderTransitionError,
} from './errors/ordering.errors';

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
  shippingMethod: ShippingMethod;
}

export class Order extends AggregateRoot {
  private _id!: string;
  private _customerId!: string;
  private _lines!: OrderLine[];
  private _status!: OrderStatus;
  private _deliveryAddress!: Address;
  // snapshot, like line prices: a later price change never rewrites a placed order
  private _shippingMethodCode!: string;
  private _shippingCost!: Money;
  private _totalAmount!: Money;
  private _createdAt!: Date;
  private _updatedAt!: Date;

  // private — created only through create() or restore()
  private constructor() {
    super();
  }

  // === PLACING A NEW ORDER ===
  static create(props: CreateOrderProps): Order {
    if (props.lines.length === 0) {
      throw new EmptyOrderError();
    }

    const order = new Order();
    order._id = randomUUID();
    order._customerId = props.customerId;
    order._lines = [...props.lines];
    order._deliveryAddress = props.deliveryAddress;
    order._shippingMethodCode = props.shippingMethod.code;
    order._shippingCost = props.shippingMethod.price;
    order._status = OrderStatus.PENDING_PAYMENT;
    order._totalAmount = order.calculateTotal(); // CALCULATED, never given
    order._createdAt = new Date();
    order._updatedAt = new Date();

    order.addDomainEvent(
      new OrderPlacedEvent(order._id, order._customerId, order._totalAmount, [
        ...order._lines,
      ]),
    );

    return order;
  }

  // === RESTORING FROM STORAGE (no events, no creation rules) ===
  static restore(props: {
    id: string;
    customerId: string;
    lines: OrderLine[];
    status: OrderStatus;
    deliveryAddress: Address;
    shippingMethodCode: string;
    shippingCost: Money;
    totalAmount: Money;
    createdAt: Date;
    updatedAt: Date;
  }): Order {
    const order = new Order();
    order._id = props.id;
    order._customerId = props.customerId;
    order._lines = [...props.lines];
    order._status = props.status;
    order._deliveryAddress = props.deliveryAddress;
    order._shippingMethodCode = props.shippingMethodCode;
    order._shippingCost = props.shippingCost;
    order._totalAmount = props.totalAmount;
    order._createdAt = props.createdAt;
    order._updatedAt = props.updatedAt;
    return order;
  }

  // === TRANSITIONS (state machine) ===
  confirmPayment(): void {
    if (this._status !== OrderStatus.PENDING_PAYMENT) {
      throw new InvalidOrderTransitionError(
        'confirm payment for',
        this._status,
      );
    }
    this._status = OrderStatus.PAID;
    this.touch();
    this.addDomainEvent(new OrderPaidEvent(this._id, this._lines));
  }

  startFulfillment(): void {
    if (this._status !== OrderStatus.PAID) {
      throw new InvalidOrderTransitionError(
        'start fulfillment for',
        this._status,
      );
    }
    this._status = OrderStatus.FULFILLING;
    this.touch();
  }

  ship(): void {
    if (this._status !== OrderStatus.FULFILLING) {
      throw new InvalidOrderTransitionError('ship', this._status);
    }
    this._status = OrderStatus.SHIPPED;
    this.touch();
    this.addDomainEvent(new OrderShippedEvent(this._id, [...this._lines]));
  }

  markDelivered(): void {
    if (this._status !== OrderStatus.SHIPPED) {
      throw new InvalidOrderTransitionError('deliver', this._status);
    }
    this._status = OrderStatus.DELIVERED;
    this.touch();
  }

  cancel(reason: string): void {
    const cancellable = [OrderStatus.PENDING_PAYMENT, OrderStatus.PAID];
    if (!cancellable.includes(this._status)) {
      throw new InvalidOrderTransitionError('cancel', this._status);
    }
    this._status = OrderStatus.CANCELLED;
    this.touch();
    this.addDomainEvent(
      new OrderCancelledEvent(this._id, reason, [...this._lines]),
    );
  }

  // === HELPERS ===

  // invariant: total = lines + shipping — this is what the customer pays
  private calculateTotal(): Money {
    return this.subtotal.add(this._shippingCost);
  }

  private touch(): void {
    this._updatedAt = new Date();
  }

  // === READ-ONLY ACCESS (no setters) ===
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
  /** lines only, before shipping */
  get subtotal(): Money {
    return this._lines.reduce(
      (sum, line) => sum.add(line.lineTotal),
      Money.of(0, 'USD'),
    );
  }
  get shippingMethodCode(): string {
    return this._shippingMethodCode;
  }
  get shippingCost(): Money {
    return this._shippingCost;
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
