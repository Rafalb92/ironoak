import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  ORDER_REPOSITORY,
  type OrderRepository,
} from '../../ports/order.repository.port';

@Injectable()
export class CancelOrderUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY) private readonly orders: OrderRepository,
  ) {}

  async execute(
    orderId: string,
    customerId: string,
    reason: string,
  ): Promise<void> {
    const order = await this.orders.findById(orderId);

    if (!order || order.customerId !== customerId) {
      throw new NotFoundException('Order not found');
    }

    // agregat sam sprawdzi, czy przejście jest legalne (rzuci InvalidOrderTransitionError → 409)
    order.cancel(reason);

    await this.orders.save(order);
  }
}
