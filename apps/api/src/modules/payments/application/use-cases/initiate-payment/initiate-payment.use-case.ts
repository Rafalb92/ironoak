import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  PAYMENT_REPOSITORY,
  type PaymentRepository,
} from '../../ports/payment.repository.port';
import {
  PAYMENT_PROVIDER,
  type PaymentProvider,
} from '../../ports/payment-provider.port';
import { ORDER_LOOKUP, type OrderLookup } from '../../ports/order-lookup.port';
import { Payment } from '../../../domain/payment.aggregate';
import { Money } from '../../../../../shared-kernel/domain/value-objects/money.vo';

@Injectable()
export class InitiatePaymentUseCase {
  constructor(
    @Inject(PAYMENT_REPOSITORY) private readonly payments: PaymentRepository,
    @Inject(PAYMENT_PROVIDER) private readonly provider: PaymentProvider,
    @Inject(ORDER_LOOKUP) private readonly orders: OrderLookup,
  ) {}

  async execute(
    orderId: string,
    customerId: string,
  ): Promise<{ checkoutUrl: string }> {
    const order = await this.orders.findPayable(orderId, customerId);
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    if (order.status !== 'PENDING_PAYMENT') {
      throw new BadRequestException(
        `Order is not payable (status: ${order.status})`,
      );
    }

    // płatność już zainicjowana — zwróć zapisany URL
    const existing = await this.payments.findPendingByOrderId(orderId);
    if (existing?.checkoutUrl) {
      return { checkoutUrl: existing.checkoutUrl };
    }

    const payment =
      existing ??
      Payment.create({
        orderId,
        amount: Money.of(order.totalAmount, 'USD'),
      });

    const session = await this.provider.createCheckoutSession({
      orderId,
      amount: order.totalAmount,
      currency: 'USD',
    });

    payment.attachSession(session.sessionId, session.checkoutUrl);
    await this.payments.save(payment);

    return { checkoutUrl: session.checkoutUrl };
  }
}
