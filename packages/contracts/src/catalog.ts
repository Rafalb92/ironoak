import { z } from 'zod';

// --- wejście ---
export const productQuerySchema = z.object({
  category: z.string().optional(),
  material: z.string().optional(),
  color: z.string().optional(),
  finish: z.string().optional(),
  minWeight: z.coerce.number().int().nonnegative().optional(),
  maxWeight: z.coerce.number().int().nonnegative().optional(),
  minPrice: z.coerce.number().int().nonnegative().optional(),
  maxPrice: z.coerce.number().int().nonnegative().optional(),
  search: z.string().optional(),
  sort: z.enum(['name', 'price_asc', 'price_desc', 'newest']).default('newest'),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(12),
});
export type ProductQuery = z.infer<typeof productQuerySchema>;

// --- wyjście ---
export const productVariantSchema = z.object({
  id: z.uuid(),
  sku: z.string(),
  name: z.string(),
  price: z.number().int(), // centy
  weightGrams: z.number().int().nullable(),
  color: z.string().nullable(),
  material: z.string().nullable(),
  finish: z.string().nullable(),
  attributes: z.record(z.string(), z.unknown()).nullable(),
});
export type ProductVariant = z.infer<typeof productVariantSchema>;

export const productImageSchema = z.object({
  url: z.string(),
  alt: z.string(),
  role: z.enum(['HERO', 'DETAIL', 'LIFESTYLE']),
  variantId: z.uuid().nullable(), // null = wspólne dla produktu
});
export type ProductImage = z.infer<typeof productImageSchema>;

export const productListItemSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  slug: z.string(),
  description: z.string(),
  category: z.object({ name: z.string(), slug: z.string() }),
  priceFrom: z.number().int(),
  variants: z.array(productVariantSchema),
  images: z.array(productImageSchema),
});
export type ProductListItem = z.infer<typeof productListItemSchema>;

export const productListSchema = z.object({
  items: z.array(productListItemSchema),
  total: z.number().int(),
  page: z.number().int(),
  limit: z.number().int(),
});
export type ProductList = z.infer<typeof productListSchema>;

export const productDetailSchema = productListItemSchema.omit({ priceFrom: true });
export type ProductDetail = z.infer<typeof productDetailSchema>;

export const categorySchema = z.object({
  id: z.uuid(),
  name: z.string(),
  slug: z.string(),
});
export type Category = z.infer<typeof categorySchema>;
