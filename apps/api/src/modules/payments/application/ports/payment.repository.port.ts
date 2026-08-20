// application/ports/payment.repository.port.ts
import type { Payment } from '../../domain/payment.aggregate';

export const PAYMENT_REPOSITORY = Symbol('PAYMENT_REPOSITORY');

export interface PaymentRepository {
  findById(id: string): Promise<Payment | null>;
  findPendingByOrderId(orderId: string): Promise<Payment | null>;
  findBySessionId(sessionId: string): Promise<Payment | null>;
  save(payment: Payment): Promise<void>;
}
