import { Injectable } from '@nestjs/common';
import { CatalogService } from '../../../catalog/catalog.service';
import { Money } from '../../../../shared-kernel/domain/value-objects/money.vo';
import type {
  CatalogGateway,
  ProductSnapshot,
} from '../../application/ports/catalog-gateway.port';

/**
 * Anti-corruption layer: Catalog's read model → Ordering's snapshot.
 * The snapshot is frozen into the order forever, so it must name the product,
 * not only the variant ("Heirloom Barbell — 20kg / Cerakote").
 */
@Injectable()
export class CatalogServiceGateway implements CatalogGateway {
  constructor(private readonly catalog: CatalogService) {}

  async getSnapshots(productVariantIds: string[]): Promise<ProductSnapshot[]> {
    const summaries =
      await this.catalog.findVariantSummaries(productVariantIds);

    return summaries.map((summary) => ({
      productVariantId: summary.id,
      productName: `${summary.productName} — ${summary.name}`,
      unitPrice: Money.of(summary.price, 'USD'),
      // a variant of a deactivated product must not be orderable either
      active: summary.active,
    }));
  }
}
