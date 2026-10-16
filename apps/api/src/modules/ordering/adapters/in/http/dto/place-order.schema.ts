import { z } from 'zod';
import { addressSchema, shippingMethodCodeSchema } from '@ironoak/contracts';

export const placeOrderSchema = z.object({
  lines: z
    .array(
      z.object({
        productVariantId: z.uuid(),
        quantity: z.number().int().positive(),
      }),
    )
    .min(1, 'Order must contain at least one line'),
  // the same address rules as checkout — one definition for both entry points
  deliveryAddress: addressSchema,
  // default keeps older clients (and .http files) working
  shippingMethod: shippingMethodCodeSchema.default('STANDARD'),
});

export type PlaceOrderDto = z.infer<typeof placeOrderSchema>;
