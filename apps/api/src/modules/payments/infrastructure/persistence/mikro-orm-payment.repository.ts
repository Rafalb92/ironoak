import { EntityManager } from '@mikro-orm/postgresql';

import { Payment } from '../../domain/payment.aggregate';
import { PaymentEntitySchema } from './payment.entity';
import { PaymentMapper } from './payment.mapper';
import type { PaymentRepository } from '../../application/ports/payment.repository.port';
import { OutboxWriter } from '../../../../shared-infra/outbox/outbox-writer';

export class MikroOrmPaymentRepository implements PaymentRepository {
  constructor(private readonly em: EntityManager) {}

  async findById(id: string): Promise<Payment | null> {
    const entity = await this.em.findOne(PaymentEntitySchema, { id });
    return entity ? PaymentMapper.toDomain(entity) : null;
  }

  async findPendingByOrderId(orderId: string): Promise<Payment | null> {
    const entity = await this.em.findOne(PaymentEntitySchema, {
      orderId,
      status: 'PENDING',
    });
    return entity ? PaymentMapper.toDomain(entity) : null;
  }

  async findBySessionId(sessionId: string): Promise<Payment | null> {
    const entity = await this.em.findOne(PaymentEntitySchema, {
      providerSessionId: sessionId,
    });
    return entity ? PaymentMapper.toDomain(entity) : null;
  }

  async save(payment: Payment): Promise<void> {
    const data = PaymentMapper.toPersistence(payment);
    // upsert: nowy insert albo update istniejącego
    const existing = await this.em.findOne(PaymentEntitySchema, {
      id: payment.id,
    });
    if (existing) {
      this.em.assign(existing, data);
    } else {
      this.em.create(PaymentEntitySchema, data);
    }

    OutboxWriter.append(
      this.em,
      payment.pullDomainEvents(),
      payment.id,
      'Payment',
    );

    await this.em.flush();
  }
}
