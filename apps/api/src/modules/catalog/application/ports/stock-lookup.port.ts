export const STOCK_LOOKUP = Symbol('STOCK_LOOKUP');

export interface VariantStock {
  productVariantId: string;
  onHand: number;
  reserved: number;
  available: number;
}

export interface StockLookup {
  findForVariants(productVariantIds: string[]): Promise<VariantStock[]>;
}
