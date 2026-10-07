import { z } from 'zod';

// --- input ---
export const addItemSchema = z.object({
  productVariantId: z.uuid(),
  quantity: z.number().int().positive().max(99),
});
export type AddItemInput = z.infer<typeof addItemSchema>;

export const updateQuantitySchema = z.object({
  quantity: z.number().int().min(0).max(99),
});
export type UpdateQuantityInput = z.infer<typeof updateQuantitySchema>;

export const cartItemInputSchema = z.object({
  productVariantId: z.uuid(),
  quantity: z.number().int().positive().max(99),
});
export type CartItemInput = z.infer<typeof cartItemInputSchema>;

/** Raw items sent by the client — a guest cart to merge after login or to price. */
export const cartItemsSchema = z.object({
  items: z.array(cartItemInputSchema).max(50),
});

export const mergeCartSchema = cartItemsSchema;
export type MergeCartInput = z.infer<typeof mergeCartSchema>;

export const previewCartSchema = cartItemsSchema;
export type PreviewCartInput = z.infer<typeof previewCartSchema>;

// kept for existing imports
export const mergeCartItemSchema = cartItemInputSchema;

// --- output ---
export const cartLineSchema = z.object({
  productVariantId: z.uuid(),
  productName: z.string(),
  variantName: z.string(),
  /** null when the variant no longer exists */
  productSlug: z.string().nullable(),
  imageUrl: z.string().nullable(),
  unitPrice: z.number().int(),
  quantity: z.number().int(),
  lineTotal: z.number().int(),
  available: z.boolean(),
  maxOrderQuantity: z.number().int(),
  exceedsStock: z.boolean(),
});
export type CartLine = z.infer<typeof cartLineSchema>;

export const cartViewSchema = z.object({
  items: z.array(cartLineSchema),
  totalAmount: z.number().int(),
  currency: z.string(),
});
export type CartView = z.infer<typeof cartViewSchema>;
