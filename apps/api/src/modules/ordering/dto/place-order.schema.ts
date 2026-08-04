import { z } from 'zod';

export const placeOrderSchema = z.object({
  lines: z
    .array(
      z.object({
        productVariantId: z.string().uuid(),
        quantity: z.number().int().positive(),
      }),
    )
    .min(1, 'Order must contain at least one line'),
  deliveryAddress: z.object({
    street: z.string().min(1),
    buildingNumber: z.string().min(1),
    apartmentNumber: z.string().optional(),
    city: z.string().min(1),
    postalCode: z.string().min(1),
    country: z.string().min(1),
  }),
});

export type PlaceOrderDto = z.infer<typeof placeOrderSchema>;
