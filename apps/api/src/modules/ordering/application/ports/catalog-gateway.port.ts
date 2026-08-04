import { Money } from '../../domain/value-objects/money.vo';

export const CATALOG_GATEWAY = Symbol('CATALOG_GATEWAY');

export interface ProductSnapshot {
  productVariantId: string;
  productName: string;
  unitPrice: Money;
  active: boolean;
}

export interface CatalogGateway {
  // pobierz snapshoty cen/nazw w momencie składania zamówienia (batch — 1 zapytanie)
  getSnapshots(productVariantIds: string[]): Promise<ProductSnapshot[]>;
}
