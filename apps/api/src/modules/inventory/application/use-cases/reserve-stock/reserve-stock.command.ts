import { Inject, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  STOCK_ITEM_REPOSITORY,
  type StockItemRepository,
} from '../../ports/stock-item.repository.port';
import {
  StockReservedEvent,
  StockReservationFailedEvent,
} from '../../../domain/events/stock-reserved.event';
import type { StockItem } from '../../../domain/stock-item.aggregate';
import { OutboxWriter } from '../../../../../shared-infra/outbox/outbox-writer';

export interface ReserveStockCommand {
  orderId: string;
  lines: Array<{ productVariantId: string; quantity: number }>;
}

@Injectable()
export class ReserveStockUseCase {
  constructor(
    @Inject(STOCK_ITEM_REPOSITORY) private readonly stock: StockItemRepository,
    private readonly em: EntityManager,
  ) {}

  async execute(command: ReserveStockCommand): Promise<void> {
    const em = this.em.fork();

    await em.transactional(async (tx) => {
      // --- FAZA 1: wczytaj wszystko z blokadą i sprawdź dostępność ---
      const toReserve: Array<{ item: StockItem; quantity: number }> = [];
      const problems: string[] = [];

      for (const line of command.lines) {
        const item = await this.stock.findByVariantIdForUpdate(
          line.productVariantId,
        );

        if (!item) {
          problems.push(`No stock record for variant ${line.productVariantId}`);
          continue;
        }
        if (item.availableQuantity < line.quantity) {
          problems.push(
            `Insufficient stock for variant ${line.productVariantId}: requested ${line.quantity}, available ${item.availableQuantity}`,
          );
          continue;
        }
        toReserve.push({ item, quantity: line.quantity });
      }

      // --- FAZA 2: decyzja — wszystko albo nic ---
      if (problems.length > 0) {
        OutboxWriter.append(
          tx,
          [
            new StockReservationFailedEvent(
              command.orderId,
              problems.join('; '),
            ),
          ],
          command.orderId,
          'Order',
        );
        return; // nic nie zarezerwowano, transakcja zapisze tylko zdarzenie
      }

      // --- FAZA 3: rezerwacja (wiemy, że wszystkie się powiodą) ---
      for (const { item, quantity } of toReserve) {
        item.reserve(quantity);
        await this.stock.save(item);
      }

      OutboxWriter.append(
        tx,
        [new StockReservedEvent(command.orderId)],
        command.orderId,
        'Order',
      );
    });
  }
}
