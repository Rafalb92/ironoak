import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { EntityManager, type FilterQuery } from '@mikro-orm/postgresql';
import { ProductSchema, type IProduct } from './entities/product.entity';
import {
  ProductVariantSchema,
  type IProductVariant,
} from './entities/product-variant.entity';
import { ProductImageSchema } from './entities/product-image.entity';
import { CategorySchema } from './entities/category.entity';
import { ProductSalesSchema } from './entities/product-sales.entity';
import type { ProductQuery } from '@ironoak/contracts';
import {
  STOCK_LOOKUP,
  type StockLookup,
} from './application/ports/stock-lookup.port';
import { MAX_ORDER_QUANTITY, LOW_STOCK_THRESHOLD } from './catalog.constants';

export interface VariantAvailability {
  inStock: boolean;
  maxOrderQuantity: number;
  lowStock: boolean;
}

interface ProductPage {
  products: IProduct[];
  total: number;
}

@Injectable()
export class CatalogService {
  constructor(
    private readonly em: EntityManager,
    @Inject(STOCK_LOOKUP) private readonly stockLookup: StockLookup,
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

  async findProducts(query: ProductQuery) {
    // --- 1. filter on VARIANTS (price, weight and material live there) ---
    const variantWhere: FilterQuery<IProductVariant> = { active: true };

    if (query.material) variantWhere.material = query.material;
    if (query.color) variantWhere.color = query.color;
    if (query.finish) variantWhere.finish = query.finish;

    if (query.minWeight !== undefined || query.maxWeight !== undefined) {
      variantWhere.weightGrams = {
        ...(query.minWeight !== undefined && { $gte: query.minWeight }),
        ...(query.maxWeight !== undefined && { $lte: query.maxWeight }),
      };
    }

    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      variantWhere.price = {
        ...(query.minPrice !== undefined && { $gte: query.minPrice }),
        ...(query.maxPrice !== undefined && { $lte: query.maxPrice }),
      };
    }

    // --- 2. filter on PRODUCTS ---
    const productWhere: FilterQuery<IProduct> = { active: true };

    if (query.category) {
      const category = await this.em.findOne(CategorySchema, {
        slug: query.category,
      });
      if (!category)
        return { items: [], total: 0, page: query.page, limit: query.limit };
      productWhere.category = category.id;
    }

    if (query.search) {
      productWhere.name = { $ilike: `%${query.search}%` };
    }

    // with variant filters — narrow products to those having a matching variant
    const hasVariantFilters = Object.keys(variantWhere).length > 1; // >1 because 'active' is always set
    if (hasVariantFilters) {
      const matching = await this.em.find(ProductVariantSchema, variantWhere, {
        fields: ['product'],
      });
      const productIds = [...new Set(matching.map((v) => v.product.id))];
      if (productIds.length === 0) {
        return { items: [], total: 0, page: query.page, limit: query.limit };
      }
      productWhere.id = { $in: productIds };
    }

    // --- 3. fetch one page of products ---
    const { products, total } =
      query.sort === 'bestselling'
        ? await this.findPageBySales(productWhere, query)
        : await this.findPage(productWhere, query);

    // --- 4. load variants and images for the page (instead of populate) ---
    const productIds = products.map((p) => p.id);
    const [variants, images] = await Promise.all([
      this.em.find(ProductVariantSchema, {
        product: { $in: productIds },
        active: true,
      }),
      this.em.find(
        ProductImageSchema,
        { product: { $in: productIds } },
        { orderBy: { position: 'asc' } },
      ),
    ]);

    const variantIds = variants.map((v) => v.id);
    const availability = await this.availabilityFor(variantIds);

    // a variant is visible only when it is active AND available
    const purchasable = variants.filter(
      (v) => availability.get(v.id)?.inStock ?? false,
    );

    // a product disappears from the listing when no variant can be bought
    const productIdsWithStock = new Set(purchasable.map((v) => v.product.id));
    const visibleProducts = products.filter((p) =>
      productIdsWithStock.has(p.id),
    );

    // --- 5. map to DTO ---
    return {
      items: visibleProducts.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        description: p.description,
        category: { name: p.category.name, slug: p.category.slug },
        priceFrom: Math.min(
          ...variants.filter((v) => v.product.id === p.id).map((v) => v.price),
        ),
        variants: purchasable
          .filter((v) => v.product.id === p.id)
          .map((v) => {
            const a = availability.get(v.id)!;
            return {
              id: v.id,
              sku: v.sku,
              name: v.name,
              price: v.price,
              weightGrams: v.weightGrams,
              color: v.color,
              material: v.material,
              finish: v.finish,
              attributes: v.attributes,
              inStock: a.inStock,
              maxOrderQuantity: a.maxOrderQuantity,
              lowStock: a.lowStock,
            };
          }),
        images: images
          .filter((i) => i.product.id === p.id)
          .map((i) => ({
            url: i.url,
            alt: i.alt,
            role: i.role,
            variantId: i.variant?.id ?? null,
          })),
      })),
      total,
      page: query.page,
      limit: query.limit,
    };
  }

  private async findPage(
    where: FilterQuery<IProduct>,
    query: ProductQuery,
  ): Promise<ProductPage> {
    const [products, total] = await this.em.findAndCount(ProductSchema, where, {
      orderBy: this.buildOrderBy(query.sort),
      limit: query.limit,
      offset: (query.page - 1) * query.limit,
      populate: ['category'],
    });
    return { products, total };
  }

  /**
   * Ranks by units sold (read model, ADR-0014); unsold products follow,
   * oldest first. Ranking happens in memory: the filters are a FilterQuery,
   * and sorting by an unrelated table would require raw SQL for every filter.
   * Fine for a catalog of hundreds of products — see ADR-0014 for the limit.
   */
  private async findPageBySales(
    where: FilterQuery<IProduct>,
    query: ProductQuery,
  ): Promise<ProductPage> {
    const candidates = await this.em.find(ProductSchema, where);
    if (candidates.length === 0) return { products: [], total: 0 };

    const sales = await this.em.find(ProductSalesSchema, {
      productId: { $in: candidates.map((p) => p.id) },
    });
    const sold = new Map(sales.map((s) => [s.productId, s.unitsSold]));

    const ranked = [...candidates].sort(
      (a, b) =>
        (sold.get(b.id) ?? 0) - (sold.get(a.id) ?? 0) ||
        a.createdAt.getTime() - b.createdAt.getTime(),
    );

    const offset = (query.page - 1) * query.limit;
    const products = ranked.slice(offset, offset + query.limit);
    await this.em.populate(products, ['category']);

    return { products, total: candidates.length };
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
      variants: variants.map((v) => {
        const a = availability.get(v.id) ?? {
          inStock: false,
          maxOrderQuantity: 0,
          lowStock: false,
        };
        return {
          id: v.id,
          sku: v.sku,
          name: v.name,
          price: v.price,
          weightGrams: v.weightGrams,
          color: v.color,
          material: v.material,
          finish: v.finish,
          attributes: v.attributes,
          inStock: a.inStock,
          maxOrderQuantity: a.maxOrderQuantity,
          lowStock: a.lowStock,
        };
      }),
      images: images.map((i) => ({
        url: i.url,
        alt: i.alt,
        role: i.role,
        variantId: i.variant?.id ?? null,
      })),
    };
  }

  findCategories() {
    return this.em.find(CategorySchema, {}, { orderBy: { name: 'asc' } });
  }

  private buildOrderBy(sort: ProductQuery['sort']) {
    switch (sort) {
      case 'name':
        return { name: 'asc' as const };
      case 'newest':
        return { createdAt: 'desc' as const };
      default:
        return { createdAt: 'desc' as const };
    }
  }
}
