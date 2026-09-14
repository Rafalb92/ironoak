import {
  ConflictException,
  Injectable,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import type { StockLookup } from './application/ports/stock-lookup.port';
import { STOCK_LOOKUP } from './application/ports/stock-lookup.port';
import { randomUUID } from 'node:crypto';
import { ProductSchema } from './entities/product.entity';
import { ProductVariantSchema } from './entities/product-variant.entity';
import { CategorySchema } from './entities/category.entity';
import { OutboxWriter } from '../../shared-infra/outbox/outbox-writer';
import { CatalogEventName } from './events/catalog-event-names';
import type {
  CreateProductInput as CreateProductDto,
  UpdateProductInput as UpdateProductDto,
  CreateVariantInput as CreateVariantDto,
  UpdateVariantInput as UpdateVariantDto,
  UpdateImageInput,
  CreateImageInput,
} from '@ironoak/contracts';
import { ProductImageSchema } from './entities/product-image.entity';

@Injectable()
export class AdminCatalogService {
  constructor(
    private readonly em: EntityManager,
    @Inject(STOCK_LOOKUP) private readonly stockLookup: StockLookup,
  ) {}

  async addImage(productId: string, dto: CreateImageInput) {
    const product = await this.em.findOne(ProductSchema, { id: productId });
    if (!product) throw new NotFoundException('Product not found');

    // wariant musi należeć do tego produktu
    let variant = null;
    if (dto.variantId) {
      variant = await this.em.findOne(ProductVariantSchema, {
        id: dto.variantId,
        product: productId,
      });
      if (!variant) {
        throw new NotFoundException('Variant not found in this product');
      }
    }

    const image = this.em.create(ProductImageSchema, {
      id: randomUUID(),
      product,
      variant,
      url: dto.url,
      alt: dto.alt,
      role: dto.role,
      position: dto.position,
    });

    await this.em.flush();
    return { imageId: image.id };
  }

  async updateImage(imageId: string, dto: UpdateImageInput) {
    const image = await this.em.findOne(ProductImageSchema, { id: imageId });
    if (!image) throw new NotFoundException('Image not found');

    if (dto.variantId !== undefined) {
      if (dto.variantId === null) {
        image.variant = null;
      } else {
        const variant = await this.em.findOne(ProductVariantSchema, {
          id: dto.variantId,
          product: image.product.id,
        });
        if (!variant)
          throw new NotFoundException('Variant not found in this product');
        image.variant = variant;
      }
    }

    if (dto.alt !== undefined) image.alt = dto.alt;
    if (dto.role !== undefined) image.role = dto.role;
    if (dto.position !== undefined) image.position = dto.position;

    await this.em.flush();
    return { imageId: image.id };
  }

  async removeImage(imageId: string) {
    const image = await this.em.findOne(ProductImageSchema, { id: imageId });
    if (!image) throw new NotFoundException('Image not found');

    // twarde usunięcie — zdjęcie nie jest częścią historii zamówień
    this.em.remove(image);
    await this.em.flush();
    return { imageId, deleted: true };
  }

  async getProductDetail(id: string) {
    const product = await this.em.findOne(
      ProductSchema,
      { id },
      { populate: ['category'] },
    );
    if (!product) throw new NotFoundException('Product not found');

    // wszystkie warianty — także nieaktywne, bo to widok admina
    const variants = await this.em.find(
      ProductVariantSchema,
      { product: id },
      { orderBy: { createdAt: 'asc' } },
    );

    const images = await this.em.find(
      ProductImageSchema,
      { product: id },
      { orderBy: { position: 'asc' } },
    );

    const stock = await this.stockLookup.findForVariants(
      variants.map((v) => v.id),
    );
    const stockByVariant = new Map(stock.map((s) => [s.productVariantId, s]));

    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      active: product.active,
      category: {
        id: product.category.id,
        name: product.category.name,
        slug: product.category.slug,
      },
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      variants: variants.map((v) => {
        const s = stockByVariant.get(v.id);
        return {
          id: v.id,
          sku: v.sku,
          name: v.name,
          price: v.price,
          active: v.active,
          weightGrams: v.weightGrams,
          color: v.color,
          material: v.material,
          finish: v.finish,
          attributes: v.attributes,
          // null = pozycja magazynowa jeszcze nie powstała
          stock: s
            ? { onHand: s.onHand, reserved: s.reserved, available: s.available }
            : null,
        };
      }),
      images: images.map((i) => ({
        id: i.id,
        url: i.url,
        alt: i.alt,
        role: i.role,
        position: i.position,
        variantId: i.variant?.id ?? null,
      })),
    };
  }

  async createProduct(dto: CreateProductDto) {
    const variantId = randomUUID();
    const category = await this.em.findOne(CategorySchema, {
      id: dto.categoryId,
    });
    if (!category) throw new NotFoundException('Category not found');

    const existingSlug = await this.em.count(ProductSchema, { slug: dto.slug });
    if (existingSlug > 0)
      throw new ConflictException(`Slug '${dto.slug}' already in use`);

    const skus = dto.variants.map((v) => v.sku);
    const existingSku = await this.em.count(ProductVariantSchema, {
      sku: { $in: skus },
    });
    if (existingSku > 0)
      throw new ConflictException('One or more SKUs already in use');

    const product = this.em.create(ProductSchema, {
      name: dto.name,
      slug: dto.slug,
      description: dto.description,
      category,
      active: true,
    });

    for (const v of dto.variants) {
      const variant = this.em.create(ProductVariantSchema, {
        id: variantId,
        product,
        sku: v.sku,
        name: v.name,
        price: v.price,
        weightGrams: v.weightGrams ?? null,
        color: v.color ?? null,
        material: v.material ?? null,
        finish: v.finish ?? null,
        attributes: v.attributes ?? null,
        active: true,
      });

      OutboxWriter.appendRaw(this.em, {
        eventId: randomUUID(),
        aggregateId: variant.id,
        aggregateType: 'ProductVariant',
        eventName: CatalogEventName.VARIANT_CREATED,
        payload: { productVariantId: variant.id, initialStock: v.initialStock },
        occurredAt: new Date(),
      });
    }

    await this.em.flush();
    return { productId: product.id };
  }

  async updateProduct(id: string, dto: UpdateProductDto) {
    const product = await this.em.findOne(ProductSchema, { id });
    if (!product) throw new NotFoundException('Product not found');

    if (dto.slug && dto.slug !== product.slug) {
      const taken = await this.em.count(ProductSchema, { slug: dto.slug });
      if (taken > 0)
        throw new ConflictException(`Slug '${dto.slug}' already in use`);
    }

    if (dto.categoryId) {
      const category = await this.em.findOne(CategorySchema, {
        id: dto.categoryId,
      });
      if (!category) throw new NotFoundException('Category not found');
      product.category = category;
    }

    if (dto.name !== undefined) product.name = dto.name;
    if (dto.slug !== undefined) product.slug = dto.slug;
    if (dto.description !== undefined) product.description = dto.description;
    if (dto.active !== undefined) product.active = dto.active;

    await this.em.flush();
    return { productId: product.id };
  }

  // soft delete — historia zamówień musi zostać czytelna
  async deactivateProduct(id: string) {
    const product = await this.em.findOne(ProductSchema, { id });
    if (!product) throw new NotFoundException('Product not found');

    product.active = false;
    const variants = await this.em.find(ProductVariantSchema, { product: id });
    for (const v of variants) v.active = false;

    await this.em.flush();
    return { productId: product.id, deactivated: true };
  }

  async addVariant(productId: string, dto: CreateVariantDto) {
    const variantId = randomUUID();
    const product = await this.em.findOne(ProductSchema, { id: productId });
    if (!product) throw new NotFoundException('Product not found');

    const taken = await this.em.count(ProductVariantSchema, { sku: dto.sku });
    if (taken > 0)
      throw new ConflictException(`SKU '${dto.sku}' already in use`);

    const variant = this.em.create(ProductVariantSchema, {
      id: variantId,
      product,
      sku: dto.sku,
      name: dto.name,
      price: dto.price,
      weightGrams: dto.weightGrams ?? null,
      color: dto.color ?? null,
      material: dto.material ?? null,
      finish: dto.finish ?? null,
      attributes: dto.attributes ?? null,
      active: true,
    });

    OutboxWriter.appendRaw(this.em, {
      eventId: randomUUID(),
      aggregateId: variant.id,
      aggregateType: 'ProductVariant',
      eventName: CatalogEventName.VARIANT_CREATED,
      payload: { productVariantId: variant.id, initialStock: dto.initialStock },
      occurredAt: new Date(),
    });

    await this.em.flush();
    return { variantId: variant.id };
  }

  async updateVariant(variantId: string, dto: UpdateVariantDto) {
    const variant = await this.em.findOne(ProductVariantSchema, {
      id: variantId,
    });
    if (!variant) throw new NotFoundException('Variant not found');

    if (dto.sku && dto.sku !== variant.sku) {
      const taken = await this.em.count(ProductVariantSchema, { sku: dto.sku });
      if (taken > 0)
        throw new ConflictException(`SKU '${dto.sku}' already in use`);
      variant.sku = dto.sku;
    }

    if (dto.name !== undefined) variant.name = dto.name;
    if (dto.price !== undefined) variant.price = dto.price;
    if (dto.weightGrams !== undefined)
      variant.weightGrams = dto.weightGrams ?? null;
    if (dto.color !== undefined) variant.color = dto.color ?? null;
    if (dto.material !== undefined) variant.material = dto.material ?? null;
    if (dto.finish !== undefined) variant.finish = dto.finish ?? null;
    if (dto.attributes !== undefined)
      variant.attributes = dto.attributes ?? null;
    if (dto.active !== undefined) {
      if (dto.active) {
        // nie aktywuj wariantu w nieaktywnym produkcie — powstałby stan nie do pokazania
        const product = await this.em.findOne(ProductSchema, {
          id: variant.product.id,
        });
        if (!product?.active) {
          throw new ConflictException(
            'Cannot activate a variant of an inactive product',
          );
        }
      } else {
        // ta sama reguła co przy deactivateVariant
        const activeCount = await this.em.count(ProductVariantSchema, {
          product: variant.product.id,
          active: true,
        });
        if (activeCount <= 1 && variant.active) {
          throw new ConflictException(
            'Cannot deactivate the last active variant',
          );
        }
      }
      variant.active = dto.active;
    }

    await this.em.flush();
    return { variantId: variant.id };
  }

  async deactivateVariant(variantId: string) {
    const variant = await this.em.findOne(ProductVariantSchema, {
      id: variantId,
    });
    if (!variant) throw new NotFoundException('Variant not found');

    // nie pozwól zostawić produktu bez aktywnego wariantu
    const activeCount = await this.em.count(ProductVariantSchema, {
      product: variant.product.id,
      active: true,
    });
    if (activeCount <= 1 && variant.active) {
      throw new ConflictException(
        'Cannot deactivate the last active variant — deactivate the product instead',
      );
    }

    variant.active = false;
    await this.em.flush();
    return { variantId, deactivated: true };
  }

  // lista dla admina — także nieaktywne
  async listProducts(page = 1, limit = 20) {
    const [products, total] = await this.em.findAndCount(
      ProductSchema,
      {},
      {
        populate: ['category'],
        orderBy: { createdAt: 'desc' },
        limit,
        offset: (page - 1) * limit,
      },
    );

    const variants = await this.em.find(ProductVariantSchema, {
      product: { $in: products.map((p) => p.id) },
    });

    return {
      items: products.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        active: p.active,
        category: { id: p.category.id, name: p.category.name },
        variants: variants
          .filter((v) => v.product.id === p.id)
          .map((v) => ({
            id: v.id,
            sku: v.sku,
            name: v.name,
            price: v.price,
            active: v.active,
          })),
      })),
      total,
      page,
      limit,
    };
  }
}
