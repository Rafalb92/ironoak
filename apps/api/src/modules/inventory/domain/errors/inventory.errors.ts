import { HttpStatus } from '@nestjs/common';
import { DomainError } from '../../../../shared-kernel/domain/domain-error.base';

export class InsufficientStockError extends DomainError {
  readonly code = 'INSUFFICIENT_STOCK';
  readonly httpStatus = HttpStatus.CONFLICT;
  constructor(
    productVariantId: string,
    requestedQuantity: number,
    availableQuantity: number,
  ) {
    super(
      `Insufficient stock for product variant ${productVariantId}. Requested: ${requestedQuantity}, Available: ${availableQuantity}`,
    );
  }
}

export class InvalidStockQuantityError extends DomainError {
  readonly code = 'INVALID_STOCK_QUANTITY';
  readonly httpStatus = HttpStatus.BAD_REQUEST;
  constructor(message: string) {
    super(message);
  }
}
