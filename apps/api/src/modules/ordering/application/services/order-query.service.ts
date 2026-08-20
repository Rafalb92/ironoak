import { Inject, Injectable } from '@nestjs/common';
import {
  ORDER_REPOSITORY,
  type OrderRepository,
} from '../ports/order.repository.port';
import { Currency } from '../../../../shared-kernel/domain/value-objects/money.vo';

export interface PayableOrder {
  orderId: string;
  customerId: string;
  status: string;
  totalAmount: number;
  currency: Currency;
}

// publiczne API modułu dla innych bounded contexts — nie eksportuj OrderRepository bezpośrednio
@Injectable()
export class OrderQueryService {
  constructor(
    @Inject(ORDER_REPOSITORY) private readonly orders: OrderRepository,
  ) {}

  async findForPayment(
    orderId: string,
    customerId: string,
  ): Promise<PayableOrder | null> {
    const order = await this.orders.findById(orderId);
    if (!order || order.customerId !== customerId) return null;

    return {
      orderId: order.id,
      customerId: order.customerId,
      status: order.status,
      totalAmount: order.totalAmount.amount,
      currency: order.totalAmount.currency,
    };
  }
}
