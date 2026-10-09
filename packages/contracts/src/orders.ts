import { z } from 'zod';

export const orderStatusSchema = z.enum([
  'PENDING_PAYMENT',
  'PAID',
  'FULFILLING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
]);
export type OrderStatus = z.infer<typeof orderStatusSchema>;

export const addressSchema = z.object({
  street: z.string().trim().min(1, 'Enter the street').max(120),
  buildingNumber: z.string().trim().min(1, 'Enter the building number').max(20),
  apartmentNumber: z.string().trim().max(20).optional(),
  city: z.string().trim().min(1, 'Enter the city').max(80),
  postalCode: z.string().trim().min(1, 'Enter the postal code').max(12),
  // ISO 3166-1 alpha-2, chosen from the storefront's shipping list
  country: z.string().length(2, 'Choose a country'),
});
export type Address = z.infer<typeof addressSchema>;

export const checkoutSchema = z.object({
  deliveryAddress: addressSchema,
});
export type CheckoutInput = z.infer<typeof checkoutSchema>;

export const orderSummarySchema = z.object({
  id: z.string().uuid(),
  status: orderStatusSchema,
  totalAmount: z.number().int(),
  currency: z.string(),
  itemCount: z.number().int(),
  createdAt: z.coerce.date(),
});
export type OrderSummary = z.infer<typeof orderSummarySchema>;

export const orderLineSchema = z.object({
  productVariantId: z.string().uuid(),
  productName: z.string(),
  unitPrice: z.number().int(),
  quantity: z.number().int(),
  lineTotal: z.number().int(),
});

export const orderDetailSchema = z.object({
  id: z.string().uuid(),
  status: orderStatusSchema,
  totalAmount: z.number().int(),
  currency: z.string(),
  lines: z.array(orderLineSchema),
  deliveryAddress: addressSchema.extend({ apartmentNumber: z.string().nullable() }),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export type OrderDetail = z.infer<typeof orderDetailSchema>;
