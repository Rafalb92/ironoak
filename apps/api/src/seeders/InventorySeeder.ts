import type { EntityManager } from '@mikro-orm/postgresql';
import { Seeder } from '@mikro-orm/seeder';
import { ProductVariantSchema } from '../modules/catalog/entities/product-variant.entity';
import { randomUUID } from 'crypto';
import { StockItemEntitySchema } from '../modules/inventory/infrastructure/persistence/stock-item.entity';

export class InventorySeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    const variants = await em.find(ProductVariantSchema, {});
    for (const variant of variants) {
      em.create(StockItemEntitySchema, {
        id: randomUUID(),
        productVariantId: variant.id,
        quantityOnHand: 25,
        quantityReserved: 0,
      });
    }
    await em.flush();
  }
}
