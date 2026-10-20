import { Injectable, NotFoundException } from '@nestjs/common';
import { OrderDetailsQuery } from '../../services/order-details.query';

@Injectable()
export class GetOrderDetailsUseCase {
  constructor(private readonly details: OrderDetailsQuery) {}

  async execute(orderId: string, customerId: string) {
    const order = await this.details.findById(orderId);

    // missing OR someone else's → 404, existence is not disclosed
    if (!order || order.customerId !== customerId) {
      throw new NotFoundException('Order not found');
    }

    // the customer endpoint does not expose the customer id
    const { customerId: _owner, ...view } = order;
    return view;
  }
}
