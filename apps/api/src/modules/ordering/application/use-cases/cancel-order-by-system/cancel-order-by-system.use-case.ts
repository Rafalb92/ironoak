import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  ORDER_REPOSITORY,
  type OrderRepository,
} from '../../ports/order.repository.port';
import { InvalidOrderTransitionError } from '../../../domain/errors/ordering.errors';
import { MikroORM } from '@mikro-orm/core';
import { CreateRequestContext } from '@mikro-orm/decorators/legacy';

@Injectable()
export class CancelOrderBySystemUseCase {
  private readonly logger = new Logger(CancelOrderBySystemUseCase.name);

  constructor(
    @Inject(ORDER_REPOSITORY) private readonly orders: OrderRepository,
    private readonly orm: MikroORM,
  ) {}

  @CreateRequestContext()
  async execute(orderId: string, reason: string): Promise<void> {
    const order = await this.orders.findById(orderId);
    if (!order) {
      this.logger.warn(`Cannot cancel order ${orderId}: not found`);
      return; // nie rzucamy — nikt tego nie złapie
    }

    try {
      order.cancel(reason);
      await this.orders.save(order);
      this.logger.log(`Order ${orderId} cancelled by system: ${reason}`);
    } catch (error) {
      if (error instanceof InvalidOrderTransitionError) {
        // zamówienie zdążyło zmienić stan (np. już wysłane) — nic nie robimy
        this.logger.warn(`Cannot cancel order ${orderId}: ${error.message}`);
        return;
      }
      throw error;
    }
  }
}
