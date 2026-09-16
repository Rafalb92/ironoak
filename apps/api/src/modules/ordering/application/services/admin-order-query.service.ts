import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { EntityManager, type FilterQuery } from '@mikro-orm/postgresql';
import {
  OrderEntitySchema,
  type IOrderEntity,
} from '../../infrastructure/persistence/order.entity';
import {
  CUSTOMER_LOOKUP,
  type CustomerLookup,
} from '../ports/customer-lookup.port';

export interface AdminOrderListParams {
  status?: string;
  search?: string; // fragment id zamówienia albo emaila klienta
  page: number;
  limit: number;
}

@Injectable()
export class AdminOrderQueryService {
  constructor(
    private readonly em: EntityManager,
    @Inject(CUSTOMER_LOOKUP) private readonly customers: CustomerLookup,
  ) {}

  async list(params: AdminOrderListParams) {
    const where: FilterQuery<IOrderEntity> = {};

    if (params.status) {
      where.status = params.status;
    }

    if (params.search) {
      const term = params.search.trim();
      // wygląda jak fragment uuid → szukaj po id, inaczej po emailu
      const looksLikeId = /^[0-9a-f-]{4,}$/i.test(term);

      if (looksLikeId) {
        where.id = { $ilike: `${term}%` };
      } else {
        const customerIds = await this.customers.findIdsByEmail(term);
        if (customerIds.length === 0) {
          return {
            items: [],
            total: 0,
            page: params.page,
            limit: params.limit,
          };
        }
        where.customerId = { $in: customerIds };
      }
    }

    const [orders, total] = await this.em.findAndCount(
      OrderEntitySchema,
      where,
      {
        orderBy: { createdAt: 'desc' },
        limit: params.limit,
        offset: (params.page - 1) * params.limit,
      },
    );

    // dociągnij emaile jednym zapytaniem, nie N+1
    const customers = await this.customers.findByIds([
      ...new Set(orders.map((o) => o.customerId)),
    ]);
    const emailByCustomer = new Map(
      customers.map((c) => [c.customerId, c.email]),
    );

    return {
      items: orders.map((o) => ({
        id: o.id,
        customerId: o.customerId,
        customerEmail: emailByCustomer.get(o.customerId) ?? null,
        status: o.status,
        totalAmount: o.totalAmount,
        currency: o.currency,
        itemCount: (o.lines as Array<{ quantity: number }>).reduce(
          (sum, line) => sum + line.quantity,
          0,
        ),
        createdAt: o.createdAt,
      })),
      total,
      page: params.page,
      limit: params.limit,
    };
  }

  async detail(orderId: string) {
    const order = await this.em.findOne(OrderEntitySchema, { id: orderId });
    if (!order) throw new NotFoundException('Order not found');

    const [customer] = await this.customers.findByIds([order.customerId]);

    return {
      id: order.id,
      customerId: order.customerId,
      customerEmail: customer?.email ?? null,
      status: order.status,
      totalAmount: order.totalAmount,
      currency: order.currency,
      lines: order.lines,
      deliveryAddress: order.deliveryAddress,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }
}
