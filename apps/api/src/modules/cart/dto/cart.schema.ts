import { z } from 'zod';

export const addItemSchema = z.object({
  productVariantId: z.uuid(),
  quantity: z.number().int().positive().max(99),
});
export type AddItemDto = z.infer<typeof addItemSchema>;

export const updateQuantitySchema = z.object({
  quantity: z.number().int().min(0).max(99),
});
export type UpdateQuantityDto = z.infer<typeof updateQuantitySchema>;

export const mergeCartSchema = z.object({
  items: z
    .array(
      z.object({
        productVariantId: z.uuid(),
        quantity: z.number().int().positive().max(99),
      }),
    )
    .max(50),
});
export type MergeCartDto = z.infer<typeof mergeCartSchema>;
