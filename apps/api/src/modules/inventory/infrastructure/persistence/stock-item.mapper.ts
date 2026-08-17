import { StockItem } from '../../domain/stock-item.aggregate';
import { IStockItemEntity } from './stock-item.entity';

export class StockItemMapper {
  static toPersistence(item: StockItem) {
    return {
      id: item.id,
      productVariantId: item.productVariantId,
      quantityOnHand: item.quantityOnHand,
      quantityReserved: item.quantityReserved,
    };
  }

  static toDomain(entity: IStockItemEntity): StockItem {
    return StockItem.restore({
      id: entity.id,
      productVariantId: entity.productVariantId,
      quantityOnHand: entity.quantityOnHand,
      quantityReserved: entity.quantityReserved,
    });
  }
}
