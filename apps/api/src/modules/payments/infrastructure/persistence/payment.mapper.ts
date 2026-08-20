import { Payment, PaymentStatus } from '../../domain/payment.aggregate';
import { Money } from '../../../../shared-kernel/domain/value-objects/money.vo';
import type { IPaymentEntity } from './payment.entity';

export class PaymentMapper {
  // === AGREGAT → ENCJA (zapis) ===
  static toPersistence(payment: Payment): Omit<IPaymentEntity, never> {
    return {
      id: payment.id,
      orderId: payment.orderId,
      amount: payment.amount.amount,
      currency: payment.amount.currency,
      status: payment.status,
      providerSessionId: payment.providerSessionId,
      checkoutUrl: payment.checkoutUrl,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
    };
  }

  // === ENCJA → AGREGAT (odczyt) — używa restore(), NIE create()! ===
  static toDomain(entity: IPaymentEntity): Payment {
    return Payment.restore({
      id: entity.id,
      orderId: entity.orderId,
      amount: Money.of(entity.amount, entity.currency as 'USD'),
      status: entity.status as PaymentStatus,
      providerSessionId: entity.providerSessionId ?? null,
      checkoutUrl: entity.checkoutUrl ?? null,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }
}
