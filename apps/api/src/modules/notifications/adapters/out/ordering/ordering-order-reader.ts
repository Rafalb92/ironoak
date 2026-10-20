import { Injectable } from '@nestjs/common';
import { OrderDetailsQuery } from '../../../../ordering/application/services/order-details.query';
import type {
  OrderForEmail,
  OrderReader,
} from '../../../application/ports/order-reader.port';

/** Anti-corruption layer: translates Ordering's view into what Notifications needs. */
@Injectable()
export class OrderingOrderReader implements OrderReader {
  constructor(private readonly details: OrderDetailsQuery) {}

  async findForEmail(orderId: string): Promise<OrderForEmail | null> {
    const order = await this.details.findById(orderId);
    if (!order) return null;

    return {
      id: order.id,
      customerId: order.customerId,
      createdAt: order.createdAt,
      currency: order.currency,
      lines: order.lines.map((line) => ({
        productName: line.productName,
        quantity: line.quantity,
        lineTotal: line.lineTotal,
      })),
      subtotalAmount: order.subtotalAmount,
      shippingName: order.shippingMethod.name,
      shippingAmount: order.shippingAmount,
      totalAmount: order.totalAmount,
      address: order.deliveryAddress,
    };
  }
}
