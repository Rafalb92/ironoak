import { Inject, Injectable, Logger } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  STOCK_ITEM_REPOSITORY,
  type StockItemRepository,
} from '../../ports/stock-item.repository.port';
import { StockShippedEvent } from '../../../domain/events/stock-shipped.event';
import { InvalidStockQuantityError } from '../../../domain/errors/inventory.errors';
import type { StockItem } from '../../../domain/stock-item.aggregate';
import { OutboxWriter } from '../../../../../shared-infra/outbox/outbox-writer';

export interface ShipStockCommand {
  orderId: string;
  lines: Array<{ productVariantId: string; quantity: number }>;
}

@Injectable()
export class ShipStockUseCase {
  private readonly logger = new Logger(ShipStockUseCase.name);

  constructor(
    @Inject(STOCK_ITEM_REPOSITORY) private readonly stock: StockItemRepository,
    private readonly em: EntityManager,
  ) {}

  async execute(command: ShipStockCommand): Promise<void> {
    const em = this.em.fork();

    await em.transactional(async (tx) => {
      // --- FAZA 1: wczytaj wszystko z blokadą i sprawdź, czy jest co wysłać ---
      const toShip: Array<{ item: StockItem; quantity: number }> = [];
      const problems: string[] = [];

      for (const line of command.lines) {
        const item = await this.stock.findByVariantIdForUpdate(
          line.productVariantId,
        );

        if (!item) {
          problems.push(`No stock record for variant ${line.productVariantId}`);
          continue;
        }
        if (item.quantityReserved < line.quantity) {
          problems.push(
            `Cannot ship variant ${line.productVariantId}: requested ${line.quantity}, reserved ${item.quantityReserved}`,
          );
          continue;
        }
        toShip.push({ item, quantity: line.quantity });
      }

      // --- FAZA 2: decyzja — wszystko albo nic ---
      // Ordering nie nasłuchuje na porażkę wysyłki (reaguje tylko na
      // StockReservationFailed) — to sytuacja niespójności danych, nie
      // biznesowy przypadek do obsłużenia zdarzeniem. Logujemy i wywalamy
      // transakcję, żeby konsument (np. inbox listener) mógł zdecydować o retry.
      if (problems.length > 0) {
        const message = problems.join('; ');
        this.logger.error(
          `Failed to ship stock for order ${command.orderId}: ${message}`,
        );
        throw new InvalidStockQuantityError(message);
      }

      // --- FAZA 3: wysyłka (wiemy, że wszystkie się powiodą) ---
      for (const { item, quantity } of toShip) {
        item.ship(quantity); // agregat pilnuje niezmiennika
        await this.stock.save(item);
      }

      OutboxWriter.append(
        tx,
        [new StockShippedEvent(command.orderId)],
        command.orderId,
        'Order',
      );
    });
  }
}
