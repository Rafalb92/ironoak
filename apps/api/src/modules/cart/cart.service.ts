import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../../shared-infra/redis/redis.module';
import { CatalogService } from '../catalog/catalog.service';
import type { CartItemInput, CartView } from '@ironoak/contracts';
import { MAX_ORDER_QUANTITY } from '../catalog/catalog.constants';
import {
  STOCK_LOOKUP,
  type StockLookup,
} from '../catalog/application/ports/stock-lookup.port';

// what actually lives in Redis — the minimum
interface CartItem {
  productVariantId: string;
  quantity: number;
}

// same ceiling as the input contracts
const MAX_LINE_QUANTITY = 99;

@Injectable()
export class CartService {
  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    private readonly catalog: CatalogService,
    private readonly config: ConfigService,
    @Inject(STOCK_LOOKUP) private readonly stockLookup: StockLookup,
  ) {}

  private get cartTtlSeconds(): number {
    return Number(this.config.getOrThrow<string>('CART_TTL_SECONDS'));
  }

  private key(userId: string): string {
    return `cart:${userId}`;
  }

  // --- raw Redis operations ---

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
      this.cartTtlSeconds,
    );
  }

  // --- public operations ---

  async addItem(
    userId: string,
    productVariantId: string,
    quantity: number,
  ): Promise<CartView> {
    const items = await this.readItems(userId);
    const existing = items.find((i) => i.productVariantId === productVariantId);

    if (existing) {
      existing.quantity = Math.min(
        existing.quantity + quantity,
        MAX_LINE_QUANTITY,
      );
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

  async getCart(userId: string): Promise<CartView> {
    return this.view(await this.readItems(userId));
  }

  /** Prices a guest cart without storing anything. */
  async preview(items: CartItemInput[]): Promise<CartView> {
    return this.view(this.normalize(items));
  }

  // raw items — needed at checkout
  async getRawItems(userId: string): Promise<CartItem[]> {
    return this.readItems(userId);
  }

  // merges a guest cart after login
  async merge(userId: string, guestItems: CartItemInput[]): Promise<CartView> {
    const items = this.normalize([
      ...(await this.readItems(userId)),
      ...guestItems,
    ]);
    await this.writeItems(userId, items);
    return this.getCart(userId);
  }

  // --- shared ---

  /** One line per variant: client-held carts may repeat a variant. */
  private normalize(items: CartItemInput[]): CartItem[] {
    const byVariant = new Map<string, number>();
    for (const item of items) {
      byVariant.set(
        item.productVariantId,
        (byVariant.get(item.productVariantId) ?? 0) + item.quantity,
      );
    }
    return [...byVariant].map(([productVariantId, quantity]) => ({
      productVariantId,
      quantity: Math.min(quantity, MAX_LINE_QUANTITY),
    }));
  }

  /**
   * Items → cart view with CURRENT catalog data and stock.
   * Guests and signed-in users get exactly the same calculation.
   */
  private async view(items: CartItem[]): Promise<CartView> {
    if (items.length === 0) {
      return { items: [], totalAmount: 0, currency: 'USD' };
    }

    const variantIds = items.map((i) => i.productVariantId);
    const [summaries, stock] = await Promise.all([
      this.catalog.findVariantSummaries(variantIds),
      this.stockLookup.findForVariants(variantIds),
    ]);
    const summaryById = new Map(summaries.map((s) => [s.id, s]));
    const stockById = new Map(stock.map((s) => [s.productVariantId, s]));

    const lines = items.map((item) => {
      const summary = summaryById.get(item.productVariantId);
      const availableQty = stockById.get(item.productVariantId)?.available ?? 0;
      const unitPrice = summary?.price ?? 0;

      return {
        productVariantId: item.productVariantId,
        productName: summary?.productName ?? 'Unavailable product',
        variantName: summary?.name ?? '',
        productSlug: summary?.productSlug ?? null,
        imageUrl: summary?.imageUrl ?? null,
        unitPrice,
        quantity: item.quantity,
        lineTotal: unitPrice * item.quantity,
        available: (summary?.active ?? false) && availableQty > 0,
        // how many can really be bought — the storefront caps its selector
        maxOrderQuantity: Math.min(availableQty, MAX_ORDER_QUANTITY),
        // the cart holds more than is left
        exceedsStock: item.quantity > availableQty,
      };
    });

    const totalAmount = lines
      .filter((line) => line.available)
      .reduce((sum, line) => sum + line.lineTotal, 0);

    return { items: lines, totalAmount, currency: 'USD' };
  }
}
