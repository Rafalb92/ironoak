import { Inject, Injectable } from '@nestjs/common';
import {
  ORDER_REPOSITORY,
  type OrderRepository,
} from '../ports/order.repository.port';
import { ShippingMethod } from '../../domain/value-objects/shipping-method.vo';

export interface OrderDetailsView {
  id: string;
  customerId: string;
  status: string;
  subtotalAmount: number;
  shippingMethod: { code: string; name: string };
  shippingAmount: number;
  totalAmount: number;
  currency: string;
  lines: {
    productVariantId: string;
    productName: string;
    unitPrice: number;
    quantity: number;
    lineTotal: number;
  }[];
  deliveryAddress: {
    recipientName: string | null;
    phone: string | null;
    street: string;
    buildingNumber: string;
    apartmentNumber: string | null;
    city: string;
    postalCode: string;
    country: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

/**
 * One mapping of an order to a plain view, shared by the customer endpoint
 * and other contexts (Notifications). No ownership check here: callers that
 * serve a customer request check ownership themselves.
 */
@Injectable()
export class OrderDetailsQuery {
  constructor(
    @Inject(ORDER_REPOSITORY) private readonly orders: OrderRepository,
  ) {}

  async findById(orderId: string): Promise<OrderDetailsView | null> {
    const order = await this.orders.findById(orderId);
    if (!order) return null;

    return {
      id: order.id,
      customerId: order.customerId,
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
