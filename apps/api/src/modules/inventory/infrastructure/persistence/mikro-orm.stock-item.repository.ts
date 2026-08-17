import { EntityManager, LockMode } from '@mikro-orm/postgresql';
import { StockItemRepository } from '../../application/ports/stock-item.repository.port';
import { StockItem } from '../../domain/stock-item.aggregate';
import { StockItemMapper } from './stock-item.mapper';
import { StockItemEntitySchema } from './stock-item.entity';

export class MikroOrmStockItemRepository implements StockItemRepository {
  constructor(private readonly em: EntityManager) {}

  async findByVariantId(productVariantId: string): Promise<StockItem | null> {
    const entity = await this.em.findOne(StockItemEntitySchema, {
      productVariantId,
    });
    return entity ? StockItemMapper.toDomain(entity) : null;
  }

  async findByVariantIdForUpdate(
    productVariantId: string,
  ): Promise<StockItem | null> {
    const entity = await this.em.findOne(
      StockItemEntitySchema,
      { productVariantId },
      { lockMode: LockMode.PESSIMISTIC_WRITE }, // ← SELECT ... FOR UPDATE
    );
    return entity ? StockItemMapper.toDomain(entity) : null;
  }

  async save(item: StockItem): Promise<void> {
    const data = StockItemMapper.toPersistence(item);
    const existing = await this.em.findOne(StockItemEntitySchema, {
      id: item.id,
    });
    if (existing) {
      this.em.assign(existing, data);
    } else {
      this.em.create(StockItemEntitySchema, data);
    }
    await this.em.flush();
  }
}
