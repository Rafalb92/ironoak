import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  STOCK_ITEM_REPOSITORY,
  type StockItemRepository,
} from '../../ports/stock-item.repository.port';
import { EntityManager } from '@mikro-orm/postgresql';

@Injectable()
export class AdjustStockUseCase {
  constructor(
    @Inject(STOCK_ITEM_REPOSITORY) private readonly stock: StockItemRepository,
    private readonly em: EntityManager,
  ) {}

  async execute(
    productVariantId: string,
    newQuantityOnHand: number,
  ): Promise<void> {
    const em = this.em.fork();

    await em.transactional(async () => {
      const item = await this.stock.findByVariantIdForUpdate(productVariantId);
      if (!item) throw new NotFoundException('Stock item not found');

      // ustawienie stanu bezwzględnego — agregat pilnuje, by nie zejść poniżej rezerwacji
      item.setOnHand(newQuantityOnHand);
      await this.stock.save(item);
    });
  }
}
