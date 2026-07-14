import { Injectable, NotFoundException } from '@nestjs/common';
import { EntityManager, type FilterQuery } from '@mikro-orm/postgresql';
import { ProductSchema, type IProduct } from './entities/product.entity';
import {
  ProductVariantSchema,
  type IProductVariant,
} from './entities/product-variant.entity';
import { ProductImageSchema } from './entities/product-image.entity';
import { CategorySchema } from './entities/category.entity';
import type { ProductQuery } from './dto/product-query.schema';

@Injectable()
export class CatalogService {
  constructor(private readonly em: EntityManager) {}

  async findProducts(query: ProductQuery) {
    // --- 1. zbuduj filtr na WARIANTACH (bo tam są cena, waga, materiał) ---
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

    // --- 2. filtr na PRODUKTACH ---
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

    // jeśli są filtry wariantowe — zawęź produkty do tych, które mają pasujący wariant
    const hasVariantFilters = Object.keys(variantWhere).length > 1; // >1 bo 'active' zawsze jest
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

    // --- 3. pobierz produkty z paginacją ---
    const [products, total] = await this.em.findAndCount(
      ProductSchema,
      productWhere,
      {
        orderBy: this.buildOrderBy(query.sort),
        limit: query.limit,
        offset: (query.page - 1) * query.limit,
        populate: ['category'],
      },
    );

    // --- 4. dociągnij warianty i zdjęcia dla znalezionych produktów (zamiast populate) ---
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

    // --- 5. zmapuj na DTO ---
    return {
      items: products.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        description: p.description,
        category: { name: p.category.name, slug: p.category.slug },
        priceFrom: Math.min(
          ...variants.filter((v) => v.product.id === p.id).map((v) => v.price),
        ),
        variants: variants
          .filter((v) => v.product.id === p.id)
          .map((v) => ({
            id: v.id,
            sku: v.sku,
            name: v.name,
            price: v.price,
            weightGrams: v.weightGrams,
            color: v.color,
            material: v.material,
            finish: v.finish,
            attributes: v.attributes,
          })),
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

  async findBySlug(slug: string) {
    const product = await this.em.findOne(
      ProductSchema,
      { slug, active: true },
      { populate: ['category'] },
    );
    if (!product) {
      throw new NotFoundException(`Product '${slug}' not found`);
    }

    const [variants, images] = await Promise.all([
      this.em.find(ProductVariantSchema, { product: product.id, active: true }),
      this.em.find(
        ProductImageSchema,
        { product: product.id },
        { orderBy: { position: 'asc' } },
      ),
    ]);

    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      category: { name: product.category.name, slug: product.category.slug },
      variants: variants.map((v) => ({
        id: v.id,
        sku: v.sku,
        name: v.name,
        price: v.price,
        weightGrams: v.weightGrams,
        color: v.color,
        material: v.material,
        finish: v.finish,
        attributes: v.attributes,
      })),
      images: images.map((i) => ({
        url: i.url,
        alt: i.alt,
        role: i.role,
        variantId: i.variant?.id ?? null, // null = wspólne dla produktu
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
