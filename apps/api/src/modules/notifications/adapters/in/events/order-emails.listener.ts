import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EntityManager } from '@mikro-orm/postgresql';
import { runOnce } from '../../../../../shared-infra/inbox/run-once';
import { OrderEventName } from '../../../../ordering/domain/events/order-event-names';
import { OrderNotificationsService } from '../../../application/services/order-notifications.service';

interface OrderEvent {
  eventId: string;
  payload: { orderId: string; reason?: string };
}

/** Each handler has its own inbox name: one event can drive several handlers independently. */
@Injectable()
export class OrderEmailsListener {
  private readonly logger = new Logger(OrderEmailsListener.name);

  constructor(
    private readonly em: EntityManager,
    private readonly notifications: OrderNotificationsService,
  ) {}

  @OnEvent(OrderEventName.PAID, { promisify: true })
  async onPaid(event: OrderEvent): Promise<void> {
    await runOnce(
      this.em,
      event.eventId,
      `${OrderEmailsListener.name}.paid`,
      this.logger,
      () =>
        this.notifications.orderConfirmed(event.eventId, event.payload.orderId),
    );
  }

  @OnEvent(OrderEventName.SHIPPED, { promisify: true })
  async onShipped(event: OrderEvent): Promise<void> {
    await runOnce(
      this.em,
      event.eventId,
      `${OrderEmailsListener.name}.shipped`,
      this.logger,
      () =>
        this.notifications.orderShipped(event.eventId, event.payload.orderId),
    );
  }

  @OnEvent(OrderEventName.CANCELLED, { promisify: true })
  async onCancelled(event: OrderEvent): Promise<void> {
    await runOnce(
      this.em,
      event.eventId,
      `${OrderEmailsListener.name}.cancelled`,
      this.logger,
      () =>
        this.notifications.orderCancelled(
          event.eventId,
          event.payload.orderId,
          event.payload.reason ?? '',
        ),
    );
  }
}
