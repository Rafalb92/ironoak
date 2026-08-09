import { Inject, Injectable } from '@nestjs/common';
import {
  ORDER_REPOSITORY,
  type OrderRepository,
} from '../../ports/order.repository.port';
import type { Order } from '../../../domain/order.aggregate';

export interface OrderSummary {
  id: string;
  status: string;
  totalAmount: number;
  currency: string;
  itemCount: number;
  createdAt: Date;
}

@Injectable()
export class GetMyOrdersUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY) private readonly orders: OrderRepository,
  ) {}

  async execute(customerId: string): Promise<OrderSummary[]> {
    const orders = await this.orders.findByCustomerId(customerId);
    return orders.map((order) => this.toSummary(order));
  }

  private toSummary(order: Order): OrderSummary {
    return {
      id: order.id,
      status: order.status,
      totalAmount: order.totalAmount.amount,
      currency: order.totalAmount.currency,
      itemCount: order.lines.reduce((sum, line) => sum + line.quantity, 0),
      createdAt: order.createdAt,
    };
  }
}
