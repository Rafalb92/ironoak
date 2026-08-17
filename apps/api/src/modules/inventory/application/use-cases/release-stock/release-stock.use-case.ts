import { Inject, Injectable, Logger } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  STOCK_ITEM_REPOSITORY,
  type StockItemRepository,
} from '../../ports/stock-item.repository.port';
import { StockReleasedEvent } from '../../../domain/events/stock-released.event';
import { InvalidStockQuantityError } from '../../../domain/errors/inventory.errors';
import type { StockItem } from '../../../domain/stock-item.aggregate';
import { OutboxWriter } from '../../../../../shared-infra/outbox/outbox-writer';

export interface ReleaseStockCommand {
  orderId: string;
  lines: Array<{ productVariantId: string; quantity: number }>;
}

@Injectable()
export class ReleaseStockUseCase {
  private readonly logger = new Logger(ReleaseStockUseCase.name);

  constructor(
    @Inject(STOCK_ITEM_REPOSITORY) private readonly stock: StockItemRepository,
    private readonly em: EntityManager,
  ) {}

  async execute(command: ReleaseStockCommand): Promise<void> {
    const em = this.em.fork();

    await em.transactional(async (tx) => {
      // --- FAZA 1: wczytaj wszystko z blokadą i sprawdź, czy jest co zwolnić ---
      const toRelease: Array<{ item: StockItem; quantity: number }> = [];
      const problems: string[] = [];

      for (const line of command.lines) {
        const item = await this.stock.findByVariantIdForUpdate(
          line.productVariantId,
        );

        if (!item) {
          this.logger.warn(
            `No stock record for variant ${line.productVariantId}, skipping release`,
          );
          continue;
        }

        // zwolnij tyle, ile realnie zarezerwowano (może być mniej, może być 0)
        const toRelease = Math.min(line.quantity, item.quantityReserved);
        if (toRelease === 0) {
          this.logger.debug(
            `Nothing to release for variant ${line.productVariantId} (reserved: 0)`,
          );
          continue;
        }

        item.release(toRelease);
        await this.stock.save(item);
      }

      // --- FAZA 2: decyzja — wszystko albo nic ---
      // Ordering nie nasłuchuje na porażkę zwolnienia (reaguje tylko na
      // StockReservationFailed) — to sytuacja niespójności danych, nie
      // biznesowy przypadek do obsłużenia zdarzeniem. Logujemy i wywalamy
      // transakcję, żeby konsument (np. inbox listener) mógł zdecydować o retry.
      if (problems.length > 0) {
        const message = problems.join('; ');
        this.logger.error(
          `Failed to release stock for order ${command.orderId}: ${message}`,
        );
        throw new InvalidStockQuantityError(message);
      }

      // --- FAZA 3: zwolnienie rezerwacji (wiemy, że wszystkie się powiodą) ---
      for (const { item, quantity } of toRelease) {
        item.release(quantity); // agregat pilnuje niezmiennika
        await this.stock.save(item);
      }

      OutboxWriter.append(
        tx,
        [new StockReleasedEvent(command.orderId)],
        command.orderId,
        'Order',
      );
    });
  }
}
