import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  ORDER_REPOSITORY,
  type OrderRepository,
} from '../../ports/order.repository.port';
import { ShippingMethod } from '../../../domain/value-objects/shipping-method.vo';

@Injectable()
export class GetOrderDetailsUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY) private readonly orders: OrderRepository,
  ) {}

  async execute(orderId: string, customerId: string) {
    const order = await this.orders.findById(orderId);

    // missing OR someone else's → 404, existence is not disclosed
    if (!order || order.customerId !== customerId) {
      throw new NotFoundException('Order not found');
    }

    return {
      id: order.id,
      status: order.status,
      subtotalAmount: order.subtotal.amount,
      shippingMethod: {
        code: order.shippingMethodCode,
        name: ShippingMethod.nameOf(order.shippingMethodCode),
      },
      shippingAmount: order.shippingCost.amount,
      totalAmount: order.totalAmount.amount,
      currency: order.totalAmount.currency,
      lines: order.lines.map((line) => ({
        productVariantId: line.productVariantId,
        productName: line.productName,
        unitPrice: line.unitPrice.amount,
        quantity: line.quantity,
        lineTotal: line.lineTotal.amount,
      })),
      deliveryAddress: {
        recipientName: order.deliveryAddress.recipientName,
        phone: order.deliveryAddress.phone,
        street: order.deliveryAddress.street,
        buildingNumber: order.deliveryAddress.buildingNumber,
        apartmentNumber: order.deliveryAddress.apartmentNumber,
        city: order.deliveryAddress.city,
        postalCode: order.deliveryAddress.postalCode,
        country: order.deliveryAddress.country,
      },
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }
}
