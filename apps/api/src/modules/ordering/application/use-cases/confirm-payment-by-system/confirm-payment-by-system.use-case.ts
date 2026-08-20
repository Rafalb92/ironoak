import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  ORDER_REPOSITORY,
  type OrderRepository,
} from '../../ports/order.repository.port';
import { InvalidOrderTransitionError } from '../../../domain/errors/ordering.errors';
import { MikroORM } from '@mikro-orm/core';
import { CreateRequestContext } from '@mikro-orm/decorators/legacy';

@Injectable()
export class ConfirmPaymentBySystemUseCase {
  private readonly logger = new Logger(ConfirmPaymentBySystemUseCase.name);

  constructor(
    @Inject(ORDER_REPOSITORY) private readonly orders: OrderRepository,
    private readonly orm: MikroORM,
  ) {}

  @CreateRequestContext()
  async execute(orderId: string): Promise<void> {
    const order = await this.orders.findById(orderId);
    if (!order) {
      this.logger.warn(
        `Cannot confirm payment for order ${orderId}: not found`,
      );
      return; // nie rzucamy — nikt tego nie złapie
    }

    try {
      order.confirmPayment();
      await this.orders.save(order);
      this.logger.log(`Order ${orderId} payment confirmed by system`);
    } catch (error) {
      if (error instanceof InvalidOrderTransitionError) {
        // zamówienie zdążyło zmienić stan (np. już anulowane) — nic nie robimy
        this.logger.warn(
          `Cannot confirm payment for order ${orderId}: ${error.message}`,
        );
        return;
      }
      throw error;
    }
  }
}
