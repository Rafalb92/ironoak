import {
  CurrencyMismatchError,
  InvalidMoneyAmountError,
} from '../errors/ordering.errors';

export type Currency = 'USD';

export class Money {
  private constructor(
    public readonly amount: number,
    public readonly currency: Currency,
  ) {}

  static of(amount: number, currency: Currency): Money {
    if (!Number.isInteger(amount)) {
      throw new InvalidMoneyAmountError(
        'Money amount must be an integer (cents)',
      );
    }
    if (amount < 0) {
      throw new InvalidMoneyAmountError('Money amount cannot be negative');
    }
    return new Money(amount, currency);
  }

  add(other: Money): Money {
    this.assertSameCurrency(other);
    return Money.of(this.amount + other.amount, this.currency);
  }

  subtract(other: Money): Money {
    this.assertSameCurrency(other);
    const result = this.amount - other.amount;
    if (result < 0) {
      throw new InvalidMoneyAmountError('Money result cannot be negative');
    }
    return Money.of(result, this.currency);
  }

  multiply(factor: number): Money {
    if (!Number.isInteger(factor) || factor < 0) {
      throw new InvalidMoneyAmountError(
        'Multiply factor must be a non-negative integer',
      );
    }
    return Money.of(this.amount * factor, this.currency);
  }

  equals(other: Money): boolean {
    return this.amount === other.amount && this.currency === other.currency;
  }

  private assertSameCurrency(other: Money): void {
    if (this.currency !== other.currency) {
      throw new CurrencyMismatchError(this.currency, other.currency);
    }
  }
}
