import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../../shared-infra/redis/redis.module';
import { CatalogService } from '../catalog/catalog.service';

// to, co realnie leży w Redisie — minimum
interface CartItem {
  productVariantId: string;
  quantity: number;
}

// to, co zwracamy klientowi — wzbogacone o dane z katalogu
export interface CartView {
  items: Array<{
    productVariantId: string;
    productName: string;
    variantName: string;
    unitPrice: number;
    quantity: number;
    lineTotal: number;
    available: boolean;
  }>;
  totalAmount: number;
  currency: string;
}

const CART_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 dni

@Injectable()
export class CartService {
  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    private readonly catalog: CatalogService,
  ) {}

  private key(userId: string): string {
    return `cart:${userId}`;
  }

  // --- surowe operacje na Redisie ---

  private async readItems(userId: string): Promise<CartItem[]> {
    const raw = await this.redis.get(this.key(userId));
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  }

  private async writeItems(userId: string, items: CartItem[]): Promise<void> {
    if (items.length === 0) {
      await this.redis.del(this.key(userId));
      return;
    }
    await this.redis.set(
      this.key(userId),
      JSON.stringify(items),
      'EX',
      CART_TTL_SECONDS,
    );
  }

  // --- operacje publiczne ---

  async addItem(
    userId: string,
    productVariantId: string,
    quantity: number,
  ): Promise<CartView> {
    const items = await this.readItems(userId);
    const existing = items.find((i) => i.productVariantId === productVariantId);

    if (existing) {
      existing.quantity += quantity; // ten sam wariant → zwiększ ilość
    } else {
      items.push({ productVariantId, quantity });
    }

    await this.writeItems(userId, items);
    return this.getCart(userId);
  }

  async updateQuantity(
    userId: string,
    productVariantId: string,
    quantity: number,
  ): Promise<CartView> {
    const items = await this.readItems(userId);
    const existing = items.find((i) => i.productVariantId === productVariantId);
    if (!existing) {
      throw new NotFoundException('Item not in cart');
    }

    if (quantity <= 0) {
      return this.removeItem(userId, productVariantId);
    }

    existing.quantity = quantity;
    await this.writeItems(userId, items);
    return this.getCart(userId);
  }

  async removeItem(
    userId: string,
    productVariantId: string,
  ): Promise<CartView> {
    const items = await this.readItems(userId);
    const filtered = items.filter(
      (i) => i.productVariantId !== productVariantId,
    );
    await this.writeItems(userId, filtered);
    return this.getCart(userId);
  }

  async clear(userId: string): Promise<void> {
    await this.redis.del(this.key(userId));
  }

  // --- odczyt wzbogacony o AKTUALNE dane z katalogu ---

  async getCart(userId: string): Promise<CartView> {
    const items = await this.readItems(userId);
    if (items.length === 0) {
      return { items: [], totalAmount: 0, currency: 'USD' };
    }

    const variants = await this.catalog.findVariantsByIds(
      items.map((i) => i.productVariantId),
    );
    const byId = new Map(variants.map((v) => [v.id, v]));

    const enriched = items.map((item) => {
      const variant = byId.get(item.productVariantId);
      const available = variant?.active ?? false;
      const unitPrice = variant?.price ?? 0;

      return {
        productVariantId: item.productVariantId,
        productName: variant?.name ?? 'Unavailable product',
        variantName: variant?.name ?? '',
        unitPrice, // AKTUALNA cena
        quantity: item.quantity,
        lineTotal: unitPrice * item.quantity,
        available,
      };
    });

    const totalAmount = enriched
      .filter((i) => i.available)
      .reduce((sum, i) => sum + i.lineTotal, 0);

    return { items: enriched, totalAmount, currency: 'USD' };
  }

  // surowe pozycje — potrzebne przy checkoucie
  async getRawItems(userId: string): Promise<CartItem[]> {
    return this.readItems(userId);
  }

  // scalanie koszyka gościa po zalogowaniu
  async merge(userId: string, guestItems: CartItem[]): Promise<CartView> {
    const items = await this.readItems(userId);

    for (const guestItem of guestItems) {
      const existing = items.find(
        (i) => i.productVariantId === guestItem.productVariantId,
      );
      if (existing) {
        existing.quantity += guestItem.quantity;
      } else {
        items.push({ ...guestItem });
      }
    }

    await this.writeItems(userId, items);
    return this.getCart(userId);
  }
}
