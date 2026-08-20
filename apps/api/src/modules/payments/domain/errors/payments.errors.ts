import { HttpStatus } from '@nestjs/common';
import { DomainError } from '../../../../shared-kernel/domain/domain-error.base';
import type { PaymentStatus } from '../payment.aggregate';

export class InvalidPaymentTransitionError extends DomainError {
  readonly code = 'PAYMENT_INVALID_TRANSITION';

  readonly httpStatus = HttpStatus.CONFLICT;

  constructor(action: string, currentStatus: PaymentStatus) {
    super(`Cannot ${action} payment in status ${currentStatus}`);
  }
}
