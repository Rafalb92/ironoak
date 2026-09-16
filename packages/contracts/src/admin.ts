import { z } from 'zod';
import { orderStatusSchema } from './orders.js';

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


// packages/contracts/src/admin.ts
export const adminOrderQuerySchema = z.object({
  status: orderStatusSchema.optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});
export type AdminOrderQuery = z.infer<typeof adminOrderQuerySchema>;

export const adminOrderListItemSchema = z.object({
  id: z.uuid(),
  customerId: z.uuid(),
  customerEmail: z.string().nullable(),
  status: orderStatusSchema,
  totalAmount: z.number().int(),
  currency: z.string(),
  itemCount: z.number().int(),
  createdAt: z.coerce.date(),
});

export const adminOrderListSchema = z.object({
  items: z.array(adminOrderListItemSchema),
  total: z.number().int(),
  page: z.number().int(),
  limit: z.number().int(),
});
export type AdminOrderList = z.infer<typeof adminOrderListSchema>;

export const adminOrderDetailSchema = z.object({
  id: z.uuid(),
  customerId: z.uuid(),
  customerEmail: z.string().nullable(),
  status: orderStatusSchema,
  totalAmount: z.number().int(),
  currency: z.string(),
  lines: z.array(z.object({
    productVariantId: z.uuid(),
    productName: z.string(),
    unitPriceAmount: z.number().int(),
    quantity: z.number().int(),
  })),
  deliveryAddress: z.object({
    street: z.string(),
    buildingNumber: z.string(),
    apartmentNumber: z.string().nullable(),
    city: z.string(),
    postalCode: z.string(),
    country: z.string(),
  }),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export type AdminOrderDetail = z.infer<typeof adminOrderDetailSchema>;

export type UpdateProductInput = z.infer<typeof updateProductSchema>;

export const createVariantSchema = variantInputSchema;
export type CreateVariantInput = z.infer<typeof createVariantSchema>;

export const updateVariantSchema = variantInputSchema
  .partial()
  .omit({ initialStock: true })
  .extend({ active: z.boolean().optional() });
  
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

export const variantStockSchema = z.object({
  onHand: z.number().int(),
  reserved: z.number().int(),
  available: z.number().int(),
});

export const adminVariantDetailSchema = z.object({
  id: z.uuid(),
  sku: z.string(),
  name: z.string(),
  price: z.number().int(),
  active: z.boolean(),
  weightGrams: z.number().int().nullable(),
  color: z.string().nullable(),
  material: z.string().nullable(),
  finish: z.string().nullable(),
  attributes: z.record(z.string(), z.unknown()).nullable(),
  stock: variantStockSchema.nullable(),
});
export type AdminVariantDetail = z.infer<typeof adminVariantDetailSchema>;

export const adminProductImageSchema = z.object({
  id: z.uuid(),
  url: z.string(),
  alt: z.string(),
  role: z.string(),
  position: z.number().int(),
  variantId: z.uuid().nullable(),
});

export const adminProductDetailSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  slug: z.string(),
  description: z.string(),
  active: z.boolean(),
  category: z.object({ id: z.uuid(), name: z.string(), slug: z.string() }),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  variants: z.array(adminVariantDetailSchema),
  images: z.array(adminProductImageSchema),
});

export const imageRoleSchema = z.enum(['HERO', 'DETAIL', 'LIFESTYLE']);

export const createImageSchema = z.object({
  url: z.string().url(),
  alt: z.string().min(1).max(200),
  role: imageRoleSchema,
  position: z.number().int().nonnegative().default(0),
  variantId: z.uuid().nullable().optional(),
});
export type CreateImageInput = z.infer<typeof createImageSchema>;

export const updateImageSchema = z.object({
  alt: z.string().min(1).max(200).optional(),
  role: imageRoleSchema.optional(),
  position: z.number().int().nonnegative().optional(),
  variantId: z.uuid().nullable().optional(),
});
export type UpdateImageInput = z.infer<typeof updateImageSchema>;

export const imageIdResultSchema = z.object({ imageId: z.uuid() });


export type AdminProductDetail = z.infer<typeof adminProductDetailSchema>;


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
