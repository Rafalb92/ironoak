import { z } from 'zod';

// --- wejście ---
export const addItemSchema = z.object({
  productVariantId: z.uuid(),
  quantity: z.number().int().positive().max(99),
});
export type AddItemInput = z.infer<typeof addItemSchema>;

export const updateQuantitySchema = z.object({
  quantity: z.number().int().min(0).max(99),
});
export type UpdateQuantityInput = z.infer<typeof updateQuantitySchema>;

export const mergeCartItemSchema = z.object({
  productVariantId: z.uuid(),
  quantity: z.number().int().positive().max(99),
});

export const mergeCartSchema = z.object({
  items: z.array(mergeCartItemSchema).max(50),
});
export type MergeCartInput = z.infer<typeof mergeCartSchema>;

// --- wyjście ---
export const cartLineSchema = z.object({
  productVariantId: z.uuid(),
  productName: z.string(),
  variantName: z.string(),
  unitPrice: z.number().int(),
  quantity: z.number().int(),
  lineTotal: z.number().int(),
  available: z.boolean(),
});
export type CartLine = z.infer<typeof cartLineSchema>;

export const cartViewSchema = z.object({
  items: z.array(cartLineSchema),
  totalAmount: z.number().int(),
  currency: z.string(),
});
export type CartView = z.infer<typeof cartViewSchema>;
