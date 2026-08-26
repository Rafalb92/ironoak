import { DomainError } from '../domain-error.base';
import { DomainErrorStatus } from './domain-error-status';

export class InvalidMoneyAmountError extends DomainError {
  readonly code = 'MONEY_INVALID_AMOUNT';

  readonly httpStatus = DomainErrorStatus.BAD_REQUEST;

  constructor(message: string) {
    super(message);
  }
}

export class CurrencyMismatchError extends DomainError {
  readonly code = 'MONEY_CURRENCY_MISMATCH';
  readonly httpStatus = DomainErrorStatus.BAD_REQUEST;
  constructor(expected: string, actual: string) {
    super(`Currency mismatch: ${expected} vs ${actual}`);
  }
}
