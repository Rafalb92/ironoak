import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import type {
  PaymentProvider,
  CheckoutSession,
  PaymentWebhookEvent,
} from '../../application/ports/payment-provider.port';

@Injectable()
export class StripePaymentProvider implements PaymentProvider {
  private readonly logger = new Logger(StripePaymentProvider.name);
  private readonly stripe: Stripe;
  private readonly webhookSecret: string;
  private readonly successUrl: string;
  private readonly cancelUrl: string;

  constructor(config: ConfigService) {
    this.stripe = new Stripe(config.getOrThrow<string>('STRIPE_SECRET_KEY'));
    this.webhookSecret = config.getOrThrow<string>('STRIPE_WEBHOOK_SECRET');
    this.successUrl = config.getOrThrow<string>('STRIPE_SUCCESS_URL');
    this.cancelUrl = config.getOrThrow<string>('STRIPE_CANCEL_URL');
  }

  async createCheckoutSession(params: {
    orderId: string;
    amount: number;
    currency: string;
    customerEmail?: string;
  }): Promise<CheckoutSession> {
    const session = await this.stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: params.currency.toLowerCase(),
            product_data: {
              name: `IRONOAK order ${params.orderId.slice(0, 8)}`,
            },
            unit_amount: params.amount, // już w centach
          },
          quantity: 1,
        },
      ],
      // metadata wraca w webhooku — tak wiążemy sesję z zamówieniem
      metadata: { orderId: params.orderId },
      customer_email: params.customerEmail,
      success_url: `${this.successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: this.cancelUrl,
    });

    if (!session.url) {
      throw new Error('Stripe did not return a checkout URL');
    }

    return { sessionId: session.id, checkoutUrl: session.url };
  }

  verifyWebhook(rawBody: Buffer, signature: string): PaymentWebhookEvent {
    // rzuca, jeśli podpis się nie zgadza — to JEST uwierzytelnienie webhooka
    const event = this.stripe.webhooks.constructEvent(
      rawBody,
      signature,
      this.webhookSecret,
    );

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        return {
          eventId: event.id,
          type: 'payment.succeeded',
          orderId: session.metadata?.orderId ?? '',
          sessionId: session.id,
        };
      }
      case 'checkout.session.expired':
      case 'checkout.session.async_payment_failed': {
        const session = event.data.object;
        return {
          eventId: event.id,
          type: 'payment.failed',
          orderId: session.metadata?.orderId ?? '',
          sessionId: session.id,
          reason: event.type,
        };
      }
      default:
        // nieobsługiwany typ — zwracamy coś, co use case zignoruje
        throw new UnsupportedWebhookEventError(event.type);
    }
  }
}

export class UnsupportedWebhookEventError extends Error {
  constructor(public readonly eventType: string) {
    super(`Unsupported Stripe event type: ${eventType}`);
  }
}
