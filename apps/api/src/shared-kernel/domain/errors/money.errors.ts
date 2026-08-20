import { HttpStatus } from '@nestjs/common';
import { DomainError } from '../domain-error.base';

export class InvalidMoneyAmountError extends DomainError {
  readonly code = 'MONEY_INVALID_AMOUNT';

  readonly httpStatus = HttpStatus.BAD_REQUEST;

  constructor(message: string) {
    super(message);
  }
}

export class CurrencyMismatchError extends DomainError {
  readonly code = 'MONEY_CURRENCY_MISMATCH';
  readonly httpStatus = HttpStatus.BAD_REQUEST;
  constructor(expected: string, actual: string) {
    super(`Currency mismatch: ${expected} vs ${actual}`);
  }
}
