import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  ORDER_REPOSITORY,
  type OrderRepository,
} from '../../ports/order.repository.port';

@Injectable()
export class StartFulfillmentUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY) private readonly orders: OrderRepository,
  ) {}

  async execute(orderId: string): Promise<void> {
    const order = await this.orders.findById(orderId);
    if (!order) throw new NotFoundException('Order not found');
    order.startFulfillment();
    await this.orders.save(order);
  }
}
