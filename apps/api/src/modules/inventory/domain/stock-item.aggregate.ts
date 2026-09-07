import { randomUUID } from 'node:crypto';
import { AggregateRoot } from '../../../shared-kernel/domain/aggregate-root.base';
import {
  InsufficientStockError,
  InvalidStockQuantityError,
} from './errors/inventory.errors';

export interface CreateStockItemProps {
  productVariantId: string;
  quantityOnHand: number;
}

export class StockItem extends AggregateRoot {
  private _id!: string;
  private _productVariantId!: string;
  private _quantityOnHand!: number;
  private _quantityReserved!: number;

  private constructor() {
    super();
  }

  static create(props: CreateStockItemProps): StockItem {
    if (props.quantityOnHand < 0 || !Number.isInteger(props.quantityOnHand)) {
      throw new InvalidStockQuantityError(
        'Quantity on hand must be a non-negative integer',
      );
    }
    const item = new StockItem();
    item._id = randomUUID();
    item._productVariantId = props.productVariantId;
    item._quantityOnHand = props.quantityOnHand;
    item._quantityReserved = 0;
    return item;
  }

  static restore(props: {
    id: string;
    productVariantId: string;
    quantityOnHand: number;
    quantityReserved: number;
  }): StockItem {
    const item = new StockItem();
    item._id = props.id;
    item._productVariantId = props.productVariantId;
    item._quantityOnHand = props.quantityOnHand;
    item._quantityReserved = props.quantityReserved;
    return item;
  }

  // === OPERACJE — tu żyją niezmienniki ===

  reserve(quantity: number): void {
    this.assertPositive(quantity);
    if (quantity > this.availableQuantity) {
      throw new InsufficientStockError(
        this._productVariantId,
        quantity,
        this.availableQuantity,
      );
    }
    this._quantityReserved += quantity;
  }

  release(quantity: number): void {
    this.assertPositive(quantity);
    if (quantity > this._quantityReserved) {
      throw new InvalidStockQuantityError('Cannot release more than reserved');
    }
    this._quantityReserved -= quantity;
  }

  // wysyłka: towar znika z półki I przestaje być zarezerwowany
  ship(quantity: number): void {
    this.assertPositive(quantity);
    if (quantity > this._quantityReserved) {
      throw new InvalidStockQuantityError('Cannot ship more than reserved');
    }
    this._quantityReserved -= quantity;
    this._quantityOnHand -= quantity;
  }

  // uzupełnienie magazynu (admin)
  restock(quantity: number): void {
    this.assertPositive(quantity);
    this._quantityOnHand += quantity;
  }

  setOnHand(quantity: number): void {
    if (!Number.isInteger(quantity) || quantity < 0) {
      throw new InvalidStockQuantityError(
        'Quantity on hand must be a non-negative integer',
      );
    }
    if (quantity < this._quantityReserved) {
      throw new InvalidStockQuantityError(
        `Cannot set on-hand (${quantity}) below reserved (${this._quantityReserved})`,
      );
    }
    this._quantityOnHand = quantity;
  }

  private assertPositive(quantity: number): void {
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new InvalidStockQuantityError(
        'Quantity must be a positive integer',
      );
    }
  }

  // === GETTERY ===
  get id(): string {
    return this._id;
  }
  get productVariantId(): string {
    return this._productVariantId;
  }
  get quantityOnHand(): number {
    return this._quantityOnHand;
  }
  get quantityReserved(): number {
    return this._quantityReserved;
  }
  get availableQuantity(): number {
    return this._quantityOnHand - this._quantityReserved;
  }
}
