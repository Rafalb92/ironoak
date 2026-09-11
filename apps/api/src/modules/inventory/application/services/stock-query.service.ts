import { Inject, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { StockItemEntitySchema } from '../../infrastructure/persistence/stock-item.entity';

export interface StockLevel {
  productVariantId: string;
  quantityOnHand: number;
  quantityReserved: number;
  quantityAvailable: number;
}

@Injectable()
export class StockQueryService {
  constructor(private readonly em: EntityManager) {}

  async findByVariantIds(productVariantIds: string[]): Promise<StockLevel[]> {
    if (productVariantIds.length === 0) return [];

    const items = await this.em.find(StockItemEntitySchema, {
      productVariantId: { $in: productVariantIds },
    });

    return items.map((item) => ({
      productVariantId: item.productVariantId,
      quantityOnHand: item.quantityOnHand,
      quantityReserved: item.quantityReserved,
      quantityAvailable: item.quantityOnHand - item.quantityReserved,
    }));
  }
}
