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
  street: z.string().min(1),
  buildingNumber: z.string().min(1),
  apartmentNumber: z.string().optional(),
  city: z.string().min(1),
  postalCode: z.string().min(1),
  country: z.string().min(1),
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
