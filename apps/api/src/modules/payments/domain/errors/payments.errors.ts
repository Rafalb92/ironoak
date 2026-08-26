import { DomainError } from '../../../../shared-kernel/domain/domain-error.base';
import { DomainErrorStatus } from '../../../../shared-kernel/domain/errors/domain-error-status';
import type { PaymentStatus } from '../payment.aggregate';

export class InvalidPaymentTransitionError extends DomainError {
  readonly code = 'PAYMENT_INVALID_TRANSITION';

  readonly httpStatus = DomainErrorStatus.CONFLICT;

  constructor(action: string, currentStatus: PaymentStatus) {
    super(`Cannot ${action} payment in status ${currentStatus}`);
  }
}
