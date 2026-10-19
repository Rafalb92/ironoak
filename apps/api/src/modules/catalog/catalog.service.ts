import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { EntityManager, type FilterQuery } from '@mikro-orm/postgresql';
import type { ProductFacets, ProductQuery } from '@ironoak/contracts';
import { ProductSchema, type IProduct } from './entities/product.entity';
import {
  ProductVariantSchema,
  type IProductVariant,
} from './entities/product-variant.entity';
import {
  ProductImageSchema,
  type IProductImage,
} from './entities/product-image.entity';
import { CategorySchema } from './entities/category.entity';
import { ProductSalesSchema } from './entities/product-sales.entity';
import {
  STOCK_LOOKUP,
  type StockLookup,
} from './application/ports/stock-lookup.port';
import { MAX_ORDER_QUANTITY, LOW_STOCK_THRESHOLD } from './catalog.constants';
import { ProductMediaService } from './product-media.service';

export interface VariantAvailability {
  inStock: boolean;
  maxOrderQuantity: number;
  lowStock: boolean;
}

export interface VariantSummary {
  id: string;
  name: string;
  price: number;
  /** false when either the variant or its product is deactivated */
  active: boolean;
  productName: string;
  productSlug: string;
  imageUrl: string | null;
}

/** A product that can be bought: at least one active variant in stock. */
interface PurchasableProduct {
  product: IProduct;
  variants: IProductVariant[];
}

interface ListingEntry extends PurchasableProduct {
  /** lowest price among the variants matching the filters */
  priceFrom: number;
}

const byName = (a: IProduct, b: IProduct) => a.name.localeCompare(b.name, 'en');

@Injectable()
export class CatalogService {
  constructor(
    private readonly em: EntityManager,
    @Inject(STOCK_LOOKUP) private readonly stockLookup: StockLookup,
    private readonly media: ProductMediaService,
  ) {}

  /**
   * Maps raw stock to what the customer sees.
   * Deliberately hides the exact count — an order limit and a low-stock
   * signal are enough.
   */
  private async availabilityFor(
    variantIds: string[],
  ): Promise<Map<string, VariantAvailability>> {
    const stock = await this.stockLookup.findForVariants(variantIds);

    return new Map(
      stock.map((s) => [
        s.productVariantId,
        {
          inStock: s.available > 0,
          maxOrderQuantity: Math.min(s.available, MAX_ORDER_QUANTITY),
          lowStock: s.available > 0 && s.available <= LOW_STOCK_THRESHOLD,
        },
      ]),
    );
  }

  async findVariantsByIds(
    ids: string[],
  ): Promise<{ id: string; name: string; price: number; active: boolean }[]> {
    if (ids.length === 0) return [];
    const variants = await this.em.find(ProductVariantSchema, {
      id: { $in: ids },
    });
    return variants.map((v) => ({
      id: v.id,
      name: v.name,
      price: v.price,
      active: v.active,
    }));
  }

  /**
   * Everything a cart line shows: product and variant names, link target and
   * a thumbnail. Image choice matches the storefront: the variant's own image,
   * then the shared HERO, then any shared image — never a video.
   */
  async findVariantSummaries(ids: string[]): Promise<VariantSummary[]> {
    if (ids.length === 0) return [];

    const variants = await this.em.find(
      ProductVariantSchema,
      { id: { $in: ids } },
      { populate: ['product'] },
    );

    const productIds = [...new Set(variants.map((v) => v.product.id))];
    const images = await this.em.find(
      ProductImageSchema,
      { product: { $in: productIds }, type: 'IMAGE' },
      { orderBy: { position: 'asc' } },
    );

    return variants.map((variant) => {
      const productImages = images.filter(
        (i) => i.product.id === variant.product.id,
      );
      const image =
        productImages.find((i) => i.variant?.id === variant.id) ??
        productImages.find((i) => !i.variant && i.role === 'HERO') ??
        productImages.find((i) => !i.variant) ??
        null;

      return {
        id: variant.id,
        name: variant.name,
        price: variant.price,
        active: variant.active && variant.product.active,
        productName: variant.product.name,
        productSlug: variant.product.slug,
        imageUrl: image ? this.media.urlFor(image) : null,
      };
    });
  }

  /**
   * Listing: filter → drop what cannot be bought → sort → paginate, in this
   * order, so `total` and page sizes are always truthful. Ranking happens in
   * memory (ADR-0014): fine for a catalogue of hundreds of products.
   */
  async findProducts(query: ProductQuery) {
    const where = await this.productWhere(query);
    if (!where)
      return { items: [], total: 0, page: query.page, limit: query.limit };

    const { purchasable, availability } = await this.loadPurchasable(where);

    // a product matches when one of its PURCHASABLE variants matches every variant filter
    const listing: ListingEntry[] = purchasable.flatMap(
      ({ product, variants }) => {
        const matching = variants.filter((variant) =>
          this.matchesVariantFilters(variant, query),
        );
        if (matching.length === 0) return [];
        return [
          {
            product,
            variants,
            priceFrom: Math.min(...matching.map((v) => v.price)),
          },
        ];
      },
    );

    const sorted = await this.sortListing(listing, query.sort);

    const offset = (query.page - 1) * query.limit;
    const page = sorted.slice(offset, offset + query.limit);

    const images = page.length
      ? await this.em.find(
          ProductImageSchema,
          { product: { $in: page.map((entry) => entry.product.id) } },
          { orderBy: { position: 'asc' } },
        )
      : [];

    return {
      items: page.map((entry) => this.toListItem(entry, images, availability)),
      total: sorted.length,
      page: query.page,
      limit: query.limit,
    };
  }

  /**
   * Filter options built from the same purchasable data as the listing, so no
   * option leads to an empty page from the start.
   */
  async findFacets(categorySlug?: string): Promise<ProductFacets> {
    const { purchasable } = await this.loadPurchasable({ active: true });

    // categories: always the whole catalogue, so other categories stay discoverable
    const categories = new Map<
      string,
      { slug: string; name: string; count: number }
    >();
    for (const { product } of purchasable) {
      const { slug, name } = product.category;
      const entry = categories.get(slug) ?? { slug, name, count: 0 };
      entry.count += 1;
      categories.set(slug, entry);
    }

    const scope = categorySlug
      ? purchasable.filter(
          ({ product }) => product.category.slug === categorySlug,
        )
      : purchasable;

    // materials: how many products offer each one (a product counts once per material)
    const materials = new Map<string, number>();
    for (const { variants } of scope) {
      for (const material of new Set(
        variants.map((v) => v.material).filter(Boolean),
      )) {
        materials.set(
          material as string,
          (materials.get(material as string) ?? 0) + 1,
        );
      }
    }

    const prices = scope.flatMap(({ variants }) =>
      variants.map((v) => v.price),
    );
    const weights = scope.flatMap(({ variants }) =>
      variants
        .map((v) => v.weightGrams)
        .filter((w): w is number => w !== null && w !== undefined),
    );

    return {
      categories: [...categories.values()].sort((a, b) =>
        a.name.localeCompare(b.name, 'en'),
      ),
      materials: [...materials]
        .map(([value, count]) => ({ value, count }))
        .sort((a, b) => a.value.localeCompare(b.value, 'en')),
      price: prices.length
        ? { min: Math.min(...prices), max: Math.max(...prices) }
        : null,
      weight: weights.length
        ? { min: Math.min(...weights), max: Math.max(...weights) }
        : null,
    };
  }

  async findBySlug(slug: string) {
    const product = await this.em.findOne(
      ProductSchema,
      { slug, active: true },
      { populate: ['category'] },
    );
    if (!product) throw new NotFoundException(`Product '${slug}' not found`);

    const variants = await this.em.find(ProductVariantSchema, {
      product: product.id,
      active: true,
    });
    const images = await this.em.find(
      ProductImageSchema,
      { product: product.id },
      { orderBy: { position: 'asc' } },
    );

    const availability = await this.availabilityFor(variants.map((v) => v.id));

    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      category: { name: product.category.name, slug: product.category.slug },
      // anything purchasable at all — the storefront shows "Out of stock" otherwise
      inStock: variants.some((v) => availability.get(v.id)?.inStock ?? false),
      variants: variants.map((v) => this.toVariantDto(v, availability)),
      images: images.map((i) => this.toImageDto(i)),
    };
  }

  findCategories() {
    return this.em.find(CategorySchema, {}, { orderBy: { name: 'asc' } });
  }

  // --- listing helpers ---

  /** Product-level filters; null when the requested category does not exist. */
  private async productWhere(
    query: ProductQuery,
  ): Promise<FilterQuery<IProduct> | null> {
    const where: FilterQuery<IProduct> = { active: true };

    if (query.category) {
      const category = await this.em.findOne(CategorySchema, {
        slug: query.category,
      });
      if (!category) return null;
      where.category = category.id;
    }

    if (query.search) {
      where.name = { $ilike: `%${query.search}%` };
    }

    return where;
  }

  /** Products with at least one active variant in stock, and only those variants. */
  private async loadPurchasable(where: FilterQuery<IProduct>): Promise<{
    purchasable: PurchasableProduct[];
    availability: Map<string, VariantAvailability>;
  }> {
    const products = await this.em.find(ProductSchema, where, {
      populate: ['category'],
    });
    if (products.length === 0)
      return { purchasable: [], availability: new Map() };

    const variants = await this.em.find(ProductVariantSchema, {
      product: { $in: products.map((p) => p.id) },
      active: true,
    });
    const availability = await this.availabilityFor(variants.map((v) => v.id));

    const byProduct = new Map<string, IProductVariant[]>();
    for (const variant of variants) {
      if (!availability.get(variant.id)?.inStock) continue;
      const list = byProduct.get(variant.product.id) ?? [];
      list.push(variant);
      byProduct.set(variant.product.id, list);
    }

    const purchasable = products.flatMap((product) => {
      const productVariants = byProduct.get(product.id);
      return productVariants?.length
        ? [{ product, variants: productVariants }]
        : [];
    });

    return { purchasable, availability };
  }

  private matchesVariantFilters(
    variant: IProductVariant,
    query: ProductQuery,
  ): boolean {
    if (query.material && variant.material !== query.material) return false;
    if (query.color && variant.color !== query.color) return false;
    if (query.finish && variant.finish !== query.finish) return false;

    if (query.minWeight !== undefined || query.maxWeight !== undefined) {
      const weight = variant.weightGrams;
      if (weight === null || weight === undefined) return false;
      if (query.minWeight !== undefined && weight < query.minWeight)
        return false;
      if (query.maxWeight !== undefined && weight > query.maxWeight)
        return false;
    }

    if (query.minPrice !== undefined && variant.price < query.minPrice)
      return false;
    if (query.maxPrice !== undefined && variant.price > query.maxPrice)
      return false;

    return true;
  }

  private async sortListing(
    listing: ListingEntry[],
    sort: ProductQuery['sort'],
  ): Promise<ListingEntry[]> {
    const sorted = [...listing];

    switch (sort) {
      case 'name':
        return sorted.sort((a, b) => byName(a.product, b.product));

      case 'price_asc':
        return sorted.sort(
          (a, b) => a.priceFrom - b.priceFrom || byName(a.product, b.product),
        );

      case 'price_desc':
        return sorted.sort(
          (a, b) => b.priceFrom - a.priceFrom || byName(a.product, b.product),
        );

      case 'bestselling': {
        // units sold (ADR-0014); unsold products follow, oldest first
        const sales = await this.em.find(ProductSalesSchema, {
          productId: { $in: sorted.map((entry) => entry.product.id) },
        });
        const sold = new Map(sales.map((s) => [s.productId, s.unitsSold]));
        return sorted.sort(
          (a, b) =>
            (sold.get(b.product.id) ?? 0) - (sold.get(a.product.id) ?? 0) ||
            a.product.createdAt.getTime() - b.product.createdAt.getTime(),
        );
      }

      case 'newest':
      default:
        return sorted.sort(
          (a, b) =>
            b.product.createdAt.getTime() - a.product.createdAt.getTime(),
        );
    }
  }

  // --- DTO mapping ---

  private toListItem(
    entry: ListingEntry,
    images: IProductImage[],
    availability: Map<string, VariantAvailability>,
  ) {
    const { product } = entry;
    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      category: { name: product.category.name, slug: product.category.slug },
      priceFrom: entry.priceFrom,
      variants: entry.variants.map((v) => this.toVariantDto(v, availability)),
      images: images
        .filter((i) => i.product.id === product.id)
        .map((i) => this.toImageDto(i)),
    };
  }

  private toVariantDto(
    variant: IProductVariant,
    availability: Map<string, VariantAvailability>,
  ) {
    const a = availability.get(variant.id) ?? {
      inStock: false,
      maxOrderQuantity: 0,
      lowStock: false,
    };
    return {
      id: variant.id,
      sku: variant.sku,
      name: variant.name,
      price: variant.price,
      weightGrams: variant.weightGrams,
      color: variant.color,
      material: variant.material,
      finish: variant.finish,
      attributes: variant.attributes,
      inStock: a.inStock,
      maxOrderQuantity: a.maxOrderQuantity,
      lowStock: a.lowStock,
    };
  }

  private toImageDto(image: IProductImage) {
    return {
      url: this.media.urlFor(image),
      alt: image.alt,
      role: image.role,
      type: image.type,
      posterUrl: this.media.posterUrlFor(image),
      variantId: image.variant?.id ?? null,
    };
  }
}
