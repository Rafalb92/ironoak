import { randomUUID } from 'node:crypto';
import type {
  PaymentProvider,
  CheckoutSession,
  PaymentWebhookEvent,
} from '../../application/ports/payment-provider.port';

export class FakePaymentProvider implements PaymentProvider {
  async createCheckoutSession(_: {
    orderId: string;
  }): Promise<CheckoutSession> {
    const sessionId = `fake_${randomUUID()}`;
    return {
      sessionId,
      // zamiast prawdziwej bramki — endpoint symulujący webhook
      checkoutUrl: `http://localhost:3000/payments/simulate/${sessionId}`,
    };
  }

  verifyWebhook(rawBody: Buffer): PaymentWebhookEvent {
    // atrapa nie weryfikuje podpisu — po prostu parsuje
    return JSON.parse(rawBody.toString()) as PaymentWebhookEvent;
  }
}
