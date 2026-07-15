import { Money } from './money.vo';

export interface OrderLineProps {
  productVariantId: string;
  productName: string; // SNAPSHOT — kopia z katalogu w momencie zamówienia
  unitPrice: Money; // SNAPSHOT — cena zamrożona
  quantity: number;
}

export class OrderLine {
  private constructor(
    public readonly productVariantId: string,
    public readonly productName: string,
    public readonly unitPrice: Money,
    public readonly quantity: number,
  ) {}

  static of(props: OrderLineProps): OrderLine {
    if (!Number.isInteger(props.quantity) || props.quantity <= 0) {
      throw new Error('Quantity must be a positive integer');
    }
    if (!props.productName.trim()) {
      throw new Error('Product name is required');
    }
    return new OrderLine(
      props.productVariantId,
      props.productName.trim(),
      props.unitPrice,
      props.quantity,
    );
  }

  // wyliczane — cena jednostkowa × ilość (Money.multiply pilnuje reguł)
  get lineTotal(): Money {
    return this.unitPrice.multiply(this.quantity);
  }
}
