import {
  Inject,
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { Order } from '../../../domain/order.aggregate';
import { OrderLine } from '../../../domain/value-objects/order-line.vo';
import { Address } from '../../../domain/value-objects/address.vo';
import {
  ORDER_REPOSITORY,
  type OrderRepository,
} from '../../ports/order.repository.port';
import {
  CATALOG_GATEWAY,
  type CatalogGateway,
} from '../../ports/catalog-gateway.port';
import { PlaceOrderCommand } from './place-order.command';

@Injectable()
export class PlaceOrderUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY) private readonly orders: OrderRepository,
    @Inject(CATALOG_GATEWAY) private readonly catalog: CatalogGateway,
  ) {}

  async execute(command: PlaceOrderCommand): Promise<{ orderId: string }> {
    if (command.lines.length === 0) {
      throw new BadRequestException('Order must contain at least one line');
    }

    const variantIds = [
      ...new Set(command.lines.map((line) => line.productVariantId)),
    ];
    const snapshots = await this.catalog.getSnapshots(variantIds);
    const snapshotById = new Map(
      snapshots.map((snapshot) => [snapshot.productVariantId, snapshot]),
    );

    const lines = command.lines.map((line) => {
      const snapshot = snapshotById.get(line.productVariantId);
      if (!snapshot || !snapshot.active) {
        throw new NotFoundException(
          `Product variant ${line.productVariantId} is not available`,
        );
      }
      return OrderLine.of({
        productVariantId: snapshot.productVariantId,
        productName: snapshot.productName,
        unitPrice: snapshot.unitPrice,
        quantity: line.quantity,
      });
    });

    const deliveryAddress = Address.of(command.deliveryAddress);

    const order = Order.create({
      customerId: command.customerId,
      lines,
      deliveryAddress,
    });

    await this.orders.save(order);

    return { orderId: order.id };
  }
}
