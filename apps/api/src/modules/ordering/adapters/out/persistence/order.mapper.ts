import { Order, OrderStatus } from '../../../domain/order.aggregate';
import { OrderLine } from '../../../domain/value-objects/order-line.vo';
import { Address } from '../../../domain/value-objects/address.vo';
import { Money } from '../../../../../shared-kernel/domain/value-objects/money.vo';
import type { IOrderEntity, OrderLineData, AddressData } from './order.entity';

export class OrderMapper {
  // === AGGREGATE → ENTITY (write) ===
  static toPersistence(order: Order): Omit<IOrderEntity, never> {
    return {
      id: order.id,
      customerId: order.customerId,
      status: order.status,
      shippingMethod: order.shippingMethodCode,
      shippingAmount: order.shippingCost.amount,
      totalAmount: order.totalAmount.amount,
      currency: order.totalAmount.currency,
      deliveryAddress: this.addressToData(order.deliveryAddress),
      lines: order.lines.map((line) => this.lineToData(line)),
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }

  // === ENTITY → AGGREGATE (read) — uses restore(), NOT create() ===
  static toDomain(entity: IOrderEntity): Order {
    const currency = entity.currency as 'USD';
    return Order.restore({
      id: entity.id,
      customerId: entity.customerId,
      status: entity.status as OrderStatus,
      deliveryAddress: this.dataToAddress(entity.deliveryAddress),
      shippingMethodCode: entity.shippingMethod,
      shippingCost: Money.of(entity.shippingAmount, currency),
      totalAmount: Money.of(entity.totalAmount, currency),
      lines: entity.lines.map((data) => this.dataToLine(data)),
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }

  // --- helpers: value objects ↔ data ---
  private static lineToData(line: OrderLine): OrderLineData {
    return {
      productVariantId: line.productVariantId,
      productName: line.productName,
      unitPriceAmount: line.unitPrice.amount,
      quantity: line.quantity,
    };
  }

  private static dataToLine(data: OrderLineData): OrderLine {
    return OrderLine.of({
      productVariantId: data.productVariantId,
      productName: data.productName,
      unitPrice: Money.of(data.unitPriceAmount, 'USD'),
      quantity: data.quantity,
    });
  }

  private static addressToData(address: Address): AddressData {
    return {
      recipientName: address.recipientName,
      phone: address.phone,
      street: address.street,
      buildingNumber: address.buildingNumber,
      apartmentNumber: address.apartmentNumber,
      city: address.city,
      postalCode: address.postalCode,
      country: address.country,
    };
  }

  // restore, not of: stored orders may predate recipient and phone
  private static dataToAddress(data: AddressData): Address {
    return Address.restore(data);
  }
}
