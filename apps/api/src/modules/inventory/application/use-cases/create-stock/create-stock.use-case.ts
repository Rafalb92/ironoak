import { Inject, Injectable } from '@nestjs/common';
import {
  STOCK_ITEM_REPOSITORY,
  type StockItemRepository,
} from '../../ports/stock-item.repository.port';
import {
  MikroORM,
  UniqueConstraintViolationException,
} from '@mikro-orm/postgresql';
import { CreateRequestContext } from '@mikro-orm/decorators/legacy';
import { StockItem } from '../../../../inventory/domain/stock-item.aggregate';

@Injectable()
export class CreateStockItemUseCase {
  constructor(
    @Inject(STOCK_ITEM_REPOSITORY) private readonly stock: StockItemRepository,
    private readonly orm: MikroORM,
  ) {}

  @CreateRequestContext()
  async execute(
    productVariantId: string,
    initialQuantity: number,
  ): Promise<void> {
    const existing = await this.stock.findByVariantId(productVariantId);
    if (existing) return;

    try {
      const item = StockItem.create({
        productVariantId,
        quantityOnHand: initialQuantity,
      });
      await this.stock.save(item);
    } catch (error) {
      if (error instanceof UniqueConstraintViolationException) {
        // ktoś inny zdążył pierwszy — pozycja istnieje, cel osiągnięty
        return;
      }
      throw error;
    }
  }
}
