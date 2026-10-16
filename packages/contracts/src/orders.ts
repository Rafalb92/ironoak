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
  recipientName: z.string().trim().min(2, "Enter the recipient's full name").max(100),
  // loose on purpose: national formats differ too much for a strict pattern
  phone: z
    .string()
    .trim()
    .regex(/^\+?[\d\s()-]{7,20}$/, 'Enter a phone number, e.g. +1 555 010 0199'),
  street: z.string().trim().min(1, 'Enter the street').max(120),
  buildingNumber: z.string().trim().min(1, 'Enter the building number').max(20),
  apartmentNumber: z.string().trim().max(20).optional(),
  city: z.string().trim().min(1, 'Enter the city').max(80),
  postalCode: z.string().trim().min(1, 'Enter the postal code').max(12),
  // ISO 3166-1 alpha-2, chosen from the storefront's shipping list
  country: z.string().length(2, 'Choose a country'),
});
export type Address = z.infer<typeof addressSchema>;

export const shippingMethodCodeSchema = z.enum(['STANDARD', 'WHITE_GLOVE']);
export type ShippingMethodCode = z.infer<typeof shippingMethodCodeSchema>;

export const shippingOptionSchema = z.object({
  code: shippingMethodCodeSchema,
  name: z.string(),
  description: z.string(),
  estimate: z.string(),
  price: z.number().int(),
  currency: z.string(),
});
export type ShippingOption = z.infer<typeof shippingOptionSchema>;

export const shippingOptionListSchema = z.array(shippingOptionSchema);

export const checkoutSchema = z.object({
  deliveryAddress: addressSchema,
  // default keeps older clients (and .http files) working
  shippingMethod: shippingMethodCodeSchema.default('STANDARD'),
});
export type CheckoutInput = z.infer<typeof checkoutSchema>;

export const orderSummarySchema = z.object({
  id: z.uuid(),
  status: orderStatusSchema,
  totalAmount: z.number().int(),
  currency: z.string(),
  itemCount: z.number().int(),
  createdAt: z.coerce.date(),
});
export type OrderSummary = z.infer<typeof orderSummarySchema>;

export const orderLineSchema = z.object({
  productVariantId: z.uuid(),
  productName: z.string(),
  unitPrice: z.number().int(),
  quantity: z.number().int(),
  lineTotal: z.number().int(),
});

export const orderDetailSchema = z.object({
  id: z.uuid(),
  status: orderStatusSchema,
  subtotalAmount: z.number().int(),
  shippingMethod: z.object({ code: z.string(), name: z.string() }),
  shippingAmount: z.number().int(),
  totalAmount: z.number().int(),
  currency: z.string(),
  lines: z.array(orderLineSchema),
  deliveryAddress: addressSchema.extend({
    apartmentNumber: z.string().nullable(),
    recipientName: z.string().nullable(),
    phone: z.string().nullable(),
  }),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export type OrderDetail = z.infer<typeof orderDetailSchema>;

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


