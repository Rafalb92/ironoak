import { Currency } from '../../../../shared-kernel/domain/value-objects/money.vo';

// application/ports/order-lookup.port.ts
export const ORDER_LOOKUP = Symbol('ORDER_LOOKUP');

export interface PayableOrder {
  orderId: string;
  customerId: string;
  status: string;
  totalAmount: number;
  currency: Currency;
}

export interface OrderLookup {
  findPayable(
    orderId: string,
    customerId: string,
  ): Promise<PayableOrder | null>;
}
