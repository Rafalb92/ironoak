import { randomUUID } from 'node:crypto';
import { AggregateRoot } from '../../../shared-kernel/domain/aggregate-root.base';
import { Money } from '../../../shared-kernel/domain/value-objects/money.vo';
import { PaymentSucceededEvent } from './events/payment-succeeded.event';
import { PaymentFailedEvent } from './events/payment-failed.event';
import { InvalidPaymentTransitionError } from './errors/payments.errors';

export enum PaymentStatus {
  PENDING = 'PENDING',
  SUCCEEDED = 'SUCCEEDED',
  FAILED = 'FAILED',
}

export class Payment extends AggregateRoot {
  private _id!: string;
  private _orderId!: string;
  private _amount!: Money;
  private _status!: PaymentStatus;
  private _providerSessionId!: string | null;
  private _createdAt!: Date;
  private _updatedAt!: Date;
  private _checkoutUrl!: string | null;

  private constructor() {
    super();
  }

  static create(props: { orderId: string; amount: Money }): Payment {
    const payment = new Payment();
    payment._id = randomUUID();
    payment._orderId = props.orderId;
    payment._amount = props.amount;
    payment._status = PaymentStatus.PENDING;
    payment._providerSessionId = null;
    payment._createdAt = new Date();
    payment._updatedAt = new Date();
    payment._checkoutUrl = null;
    return payment;
  }

  static restore(props: {
    id: string;
    orderId: string;
    amount: Money;
    status: PaymentStatus;
    providerSessionId: string | null;
    createdAt: Date;
    updatedAt: Date;
    checkoutUrl: string | null;
  }): Payment {
    const payment = new Payment();
    Object.assign(payment, {
      _id: props.id,
      _orderId: props.orderId,
      _amount: props.amount,
      _status: props.status,
      _providerSessionId: props.providerSessionId,
      _createdAt: props.createdAt,
      _updatedAt: props.updatedAt,
      _checkoutUrl: props.checkoutUrl,
    });
    return payment;
  }

  // powiązanie z sesją u dostawcy
  attachSession(sessionId: string, checkoutUrl: string): void {
    if (this._status !== PaymentStatus.PENDING) {
      throw new InvalidPaymentTransitionError(
        'attach session to',
        this._status,
      );
    }
    this._providerSessionId = sessionId;
    this._checkoutUrl = checkoutUrl;
    this.touch();
  }

  markSucceeded(): void {
    if (this._status === PaymentStatus.SUCCEEDED) return; // idempotentnie
    if (this._status !== PaymentStatus.PENDING) {
      throw new InvalidPaymentTransitionError('succeed', this._status);
    }
    this._status = PaymentStatus.SUCCEEDED;
    this.touch();
    this.addDomainEvent(
      new PaymentSucceededEvent(this._orderId, this._id, this._amount),
    );
  }

  markFailed(reason: string): void {
    if (this._status === PaymentStatus.FAILED) return;
    if (this._status !== PaymentStatus.PENDING) {
      throw new InvalidPaymentTransitionError('fail', this._status);
    }
    this._status = PaymentStatus.FAILED;
    this.touch();
    this.addDomainEvent(
      new PaymentFailedEvent(this._orderId, this._id, reason),
    );
  }

  private touch(): void {
    this._updatedAt = new Date();
  }

  get checkoutUrl(): string | null {
    return this._checkoutUrl;
  }

  get id() {
    return this._id;
  }
  get orderId() {
    return this._orderId;
  }
  get amount() {
    return this._amount;
  }
  get status() {
    return this._status;
  }
  get providerSessionId() {
    return this._providerSessionId;
  }
  get createdAt() {
    return this._createdAt;
  }
  get updatedAt() {
    return this._updatedAt;
  }
}
