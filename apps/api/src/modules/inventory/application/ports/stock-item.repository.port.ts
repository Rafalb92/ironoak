import { StockItem } from '../../domain/stock-item.aggregate';

export const STOCK_ITEM_REPOSITORY = Symbol('STOCK_ITEM_REPOSITORY');

export interface StockItemRepository {
  findByVariantId(productVariantId: string): Promise<StockItem | null>;
  // z blokadą — do operacji modyfikujących
  findByVariantIdForUpdate(productVariantId: string): Promise<StockItem | null>;
  save(item: StockItem): Promise<void>;
}
