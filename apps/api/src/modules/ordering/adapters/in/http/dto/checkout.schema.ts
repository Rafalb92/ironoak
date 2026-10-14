import { z } from 'zod';

export const checkoutSchema = z.object({
  deliveryAddress: z.object({
    street: z.string().min(1),
    buildingNumber: z.string().min(1),
    apartmentNumber: z.string().optional(),
    city: z.string().min(1),
    postalCode: z.string().min(1),
    country: z.string().min(1),
  }),
});
export type CheckoutDto = z.infer<typeof checkoutSchema>;
