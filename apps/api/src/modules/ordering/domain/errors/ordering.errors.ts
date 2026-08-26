import { DomainError } from '../../../../shared-kernel/domain/domain-error.base';
import { DomainErrorStatus } from '../../../../shared-kernel/domain/errors/domain-error-status';
import type { OrderStatus } from '../order.aggregate';

export class EmptyOrderError extends DomainError {
  readonly code = 'ORDER_EMPTY';
  readonly httpStatus = DomainErrorStatus.BAD_REQUEST;
  constructor() {
    super('Order must contain at least one line');
  }
}

export class InvalidOrderTransitionError extends DomainError {
  readonly code = 'ORDER_INVALID_TRANSITION';

  readonly httpStatus = DomainErrorStatus.CONFLICT;

  constructor(action: string, currentStatus: OrderStatus) {
    super(`Cannot ${action} order in status ${currentStatus}`);
  }
}

export class InvalidAddressError extends DomainError {
  readonly code = 'ADDRESS_INVALID';
  readonly httpStatus = DomainErrorStatus.BAD_REQUEST;
  constructor(message: string) {
    super(message);
  }
}

export class InvalidOrderLineError extends DomainError {
  readonly code = 'ORDER_LINE_INVALID';
  readonly httpStatus = DomainErrorStatus.BAD_REQUEST;

  constructor(message: string) {
    super(message);
  }
}
