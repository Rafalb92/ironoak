import { Inject, Injectable, Logger } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  STOCK_ITEM_REPOSITORY,
  type StockItemRepository,
} from '../../ports/stock-item.repository.port';

import {
  StockReservationFailedEvent,
  StockReservedEvent,
} from '../../../domain/events/stock-reserved.event';

import { InsufficientStockError } from '../../../domain/errors/inventory.errors';
import { OutboxWriter } from '../../../../../shared-infra/outbox/outbox-writer';

export interface ReserveStockCommand {
  orderId: string;
  lines: Array<{ productVariantId: string; quantity: number }>;
}

@Injectable()
export class ReserveStockUseCase {
  private readonly logger = new Logger(ReserveStockUseCase.name);

  constructor(
    @Inject(STOCK_ITEM_REPOSITORY) private readonly stock: StockItemRepository,
    private readonly em: EntityManager,
  ) {}

  async execute(command: ReserveStockCommand): Promise<void> {
    const em = this.em.fork();

    await em.transactional(async () => {
      try {
        // rezerwuj wszystkie pozycje — blokada pesymistyczna na każdej
        for (const line of command.lines) {
          const item = await this.stock.findByVariantIdForUpdate(
            line.productVariantId,
          );
          if (!item) {
            throw new InsufficientStockError(
              line.productVariantId,
              line.quantity,
              0,
            );
          }
          item.reserve(line.quantity); // agregat pilnuje niezmiennika
          await this.stock.save(item);
        }

        OutboxWriter.append(
          em,
          [new StockReservedEvent(command.orderId)],
          command.orderId,
          'Order',
        );
      } catch (error) {
        if (error instanceof InsufficientStockError) {
          // NIE decydujemy co dalej — tylko sygnalizujemy
          throw new StockReservationFailedEvent(command.orderId, error.message);
        }
        throw error;
      }
    });
  }
}
