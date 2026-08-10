import { EntityManager } from '@mikro-orm/postgresql';

import { Order } from '../../domain/order.aggregate';
import { OrderEntitySchema } from './order.entity';
import { OrderMapper } from './order.mapper';
import type { OrderRepository } from '../../application/ports/order.repository.port';
import { OutboxWriter } from '../../../../shared-infra/outbox/outbox-writer';

export class MikroOrmOrderRepository implements OrderRepository {
  constructor(private readonly em: EntityManager) {}

  async findById(id: string): Promise<Order | null> {
    const entity = await this.em.findOne(OrderEntitySchema, { id });
    return entity ? OrderMapper.toDomain(entity) : null;
  }

  async findByCustomerId(customerId: string): Promise<Order[]> {
    const entities = await this.em.find(
      OrderEntitySchema,
      { customerId },
      { orderBy: { createdAt: 'desc' } },
    );
    return entities.map((e) => OrderMapper.toDomain(e));
  }

  async save(order: Order): Promise<void> {
    const data = OrderMapper.toPersistence(order);
    // upsert: nowy insert albo update istniejącego
    const existing = await this.em.findOne(OrderEntitySchema, { id: order.id });
    if (existing) {
      this.em.assign(existing, data);
    } else {
      this.em.create(OrderEntitySchema, data);
    }

    OutboxWriter.append(this.em, order.pullDomainEvents(), order.id, 'Order');

    await this.em.flush();
  }
}
