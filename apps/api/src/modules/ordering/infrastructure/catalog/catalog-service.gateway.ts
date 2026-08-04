import { EntityManager } from '@mikro-orm/postgresql';
import { ProductVariantSchema } from '../../../catalog/entities/product-variant.entity';
import { Money } from '../../domain/value-objects/money.vo';
import type {
  CatalogGateway,
  ProductSnapshot,
} from '../../application/ports/catalog-gateway.port';
import { CatalogService } from 'src/modules/catalog/catalog.service';

export class CatalogServiceGateway implements CatalogGateway {
  constructor(private readonly catalog: CatalogService) {}

  async getSnapshots(productVariantIds: string[]): Promise<ProductSnapshot[]> {
    const variants = await this.catalog.findVariantsByIds(productVariantIds);
    return variants.map((v) => ({
      productVariantId: v.id,
      productName: v.name,
      unitPrice: Money.of(v.price, 'USD'),
      active: v.active,
    }));
  }
}
