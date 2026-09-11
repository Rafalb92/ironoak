import { Injectable } from '@nestjs/common';
import { StockQueryService } from '../../../inventory/application/services/stock-query.service';
import type {
  StockLookup,
  VariantStock,
} from '../../application/ports/stock-lookup.port';

@Injectable()
export class InventoryStockLookup implements StockLookup {
  constructor(private readonly stock: StockQueryService) {}

  async findForVariants(productVariantIds: string[]): Promise<VariantStock[]> {
    const levels = await this.stock.findByVariantIds(productVariantIds);

    return levels.map((level) => ({
      productVariantId: level.productVariantId,
      onHand: level.quantityOnHand,
      reserved: level.quantityReserved,
      available: level.quantityAvailable,
    }));
  }
}
