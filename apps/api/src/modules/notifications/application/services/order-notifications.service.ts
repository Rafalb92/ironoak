import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ORDER_READER,
  type OrderForEmail,
  type OrderReader,
} from '../ports/order-reader.port';
import {
  CUSTOMER_DIRECTORY,
  type CustomerDirectory,
} from '../ports/customer-directory.port';
import { EmailDispatcher } from './email-dispatcher.service';
import {
  orderCancelledEmail,
  orderConfirmedEmail,
  orderShippedEmail,
  type RenderedEmail,
} from '../templates/order-emails';

@Injectable()
export class OrderNotificationsService {
  private readonly logger = new Logger(OrderNotificationsService.name);
  private readonly storefrontUrl: string;

  constructor(
    @Inject(ORDER_READER) private readonly orders: OrderReader,
    @Inject(CUSTOMER_DIRECTORY) private readonly customers: CustomerDirectory,
    private readonly dispatcher: EmailDispatcher,
    config: ConfigService,
  ) {
    this.storefrontUrl = config.getOrThrow<string>('STOREFRONT_URL');
  }

  orderConfirmed(eventId: string, orderId: string) {
    return this.notify(eventId, 'ORDER_CONFIRMED', orderId, (order) =>
      orderConfirmedEmail(order, this.orderUrl(order.id)),
    );
  }

  orderShipped(eventId: string, orderId: string) {
    return this.notify(eventId, 'ORDER_SHIPPED', orderId, (order) =>
      orderShippedEmail(order, this.orderUrl(order.id)),
    );
  }

  orderCancelled(eventId: string, orderId: string, reason: string) {
    return this.notify(eventId, 'ORDER_CANCELLED', orderId, (order) =>
      orderCancelledEmail(order, reason, `${this.storefrontUrl}/products`),
    );
  }

  private orderUrl(orderId: string): string {
    return `${this.storefrontUrl}/account/orders/${orderId}`;
  }

  private async notify(
    eventId: string,
    type: string,
    orderId: string,
    render: (order: OrderForEmail) => RenderedEmail,
  ): Promise<void> {
    const order = await this.orders.findForEmail(orderId);
    // no order or no email will not appear on a retry — skip instead of failing forever
    if (!order) {
      this.logger.warn(`${type}: order ${orderId} not found, email skipped`);
      return;
    }

    const to = await this.customers.emailOf(order.customerId);
    if (!to) {
      this.logger.warn(
        `${type}: no email for customer ${order.customerId}, email skipped`,
      );
      return;
    }

    const email = render(order);
    await this.dispatcher.dispatch(
      { eventId, type, orderId: order.id },
      { to, ...email },
    );
  }
}
