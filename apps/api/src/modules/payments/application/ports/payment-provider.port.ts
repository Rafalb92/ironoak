// application/ports/payment-provider.port.ts
export const PAYMENT_PROVIDER = Symbol('PAYMENT_PROVIDER');

export interface CheckoutSession {
  sessionId: string;
  checkoutUrl: string;
}

// nasz format, nie format dostawcy
export interface PaymentWebhookEvent {
  eventId: string;
  type: 'payment.succeeded' | 'payment.failed';
  orderId: string;
  sessionId: string;
  reason?: string;
}

export interface PaymentProvider {
  createCheckoutSession(params: {
    orderId: string;
    amount: number;
    currency: string;
    customerEmail?: string;
  }): Promise<CheckoutSession>;

  verifyWebhook(rawBody: Buffer, signature: string): PaymentWebhookEvent;
}
