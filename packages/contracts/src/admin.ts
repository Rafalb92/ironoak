import { z } from 'zod';

// --- wejście ---
const variantInputSchema = z.object({
  sku: z.string().min(1).max(64),
  name: z.string().min(1).max(200),
  price: z.number().int().positive(), // w centach
  weightGrams: z.number().int().nonnegative().nullable().optional(),
  color: z.string().max(100).nullable().optional(),
  material: z.string().max(100).nullable().optional(),
  finish: z.string().max(100).nullable().optional(),
  attributes: z.record(z.string(), z.unknown()).nullable().optional(),
  initialStock: z.number().int().nonnegative().default(0),
});

export const createProductSchema = z.object({
  name: z.string().min(1).max(200),
  slug: z
    .string()
    .min(1)
    .max(200)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with dashes'),
  description: z.string().min(1),
  categoryId: z.uuid(),
  variants: z
    .array(variantInputSchema)
    .min(1, 'A product must have at least one variant'),
});
export type CreateProductInput = z.infer<typeof createProductSchema>;

export const updateProductSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  slug: z
    .string()
    .min(1)
    .max(200)
    .regex(/^[a-z0-9-]+$/)
    .optional(),
  description: z.string().min(1).optional(),
  categoryId: z.uuid().optional(),
  active: z.boolean().optional(),
});
export type UpdateProductInput = z.infer<typeof updateProductSchema>;

export const createVariantSchema = variantInputSchema;
export type CreateVariantInput = z.infer<typeof createVariantSchema>;

export const updateVariantSchema = variantInputSchema
  .partial()
  .omit({ initialStock: true });
export type UpdateVariantInput = z.infer<typeof updateVariantSchema>;

export const adjustStockSchema = z.object({
  quantityOnHand: z.number().int().nonnegative(),
});
export type AdjustStockInput = z.infer<typeof adjustStockSchema>;

// --- wyjście ---
export const adminVariantListItemSchema = z.object({
  id: z.uuid(),
  sku: z.string(),
  name: z.string(),
  price: z.number().int(),
  active: z.boolean(),
});
export type AdminVariantListItem = z.infer<typeof adminVariantListItemSchema>;

export const adminProductListItemSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  slug: z.string(),
  active: z.boolean(),
  category: z.object({ id: z.uuid(), name: z.string() }),
  variants: z.array(adminVariantListItemSchema),
});
export type AdminProductListItem = z.infer<typeof adminProductListItemSchema>;

export const adminProductListSchema = z.object({
  items: z.array(adminProductListItemSchema),
  total: z.number().int(),
  page: z.number().int(),
  limit: z.number().int(),
});
export type AdminProductList = z.infer<typeof adminProductListSchema>;

export const productIdResultSchema = z.object({
  productId: z.uuid(),
});
export type ProductIdResult = z.infer<typeof productIdResultSchema>;

export const productDeactivatedResultSchema = z.object({
  productId: z.uuid(),
  deactivated: z.literal(true),
});
export type ProductDeactivatedResult = z.infer<
  typeof productDeactivatedResultSchema
>;

export const variantIdResultSchema = z.object({
  variantId: z.uuid(),
});
export type VariantIdResult = z.infer<typeof variantIdResultSchema>;

export const variantDeactivatedResultSchema = z.object({
  variantId: z.uuid(),
  deactivated: z.literal(true),
});
export type VariantDeactivatedResult = z.infer<
  typeof variantDeactivatedResultSchema
>;
