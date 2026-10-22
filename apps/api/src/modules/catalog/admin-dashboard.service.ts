import { Inject, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import type { AdminLowStockItem } from '@ironoak/contracts';
import { ProductVariantSchema } from './entities/product-variant.entity';
import {
  STOCK_LOOKUP,
  type StockLookup,
} from './application/ports/stock-lookup.port';
import { LOW_STOCK_THRESHOLD } from './catalog.constants';

/**
 * Low stock for the dashboard. Catalog knows product and variant names and
 * already reads stock through its port — Inventory alone would only know ids.
 */
@Injectable()
export class CatalogAdminDashboardService {
  constructor(
    private readonly em: EntityManager,
    @Inject(STOCK_LOOKUP) private readonly stockLookup: StockLookup,
  ) {}

  async lowStock(limit = 8): Promise<AdminLowStockItem[]> {
    const variants = await this.em.find(
      ProductVariantSchema,
      { active: true, product: { active: true } },
      { populate: ['product'] },
    );
    if (variants.length === 0) return [];

    const stock = await this.stockLookup.findForVariants(
      variants.map((v) => v.id),
    );
    const available = new Map(
      stock.map((s) => [s.productVariantId, s.available]),
    );

    return variants
      .map((variant) => ({
        productId: variant.product.id,
        productName: variant.product.name,
        variantId: variant.id,
        variantName: variant.name,
        sku: variant.sku,
        available: available.get(variant.id) ?? 0,
      }))
      .filter((item) => item.available <= LOW_STOCK_THRESHOLD)
      .sort(
        (a, b) =>
          a.available - b.available ||
          a.productName.localeCompare(b.productName, 'en'),
      )
      .slice(0, limit);
  }
}
