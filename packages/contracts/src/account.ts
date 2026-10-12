import { z } from 'zod';
import { addressSchema } from './orders.js';

// --- input ---
export const createSavedAddressSchema = addressSchema.extend({
  isDefault: z.boolean().optional(),
});
export type CreateSavedAddressInput = z.infer<typeof createSavedAddressSchema>;

export const updateSavedAddressSchema = createSavedAddressSchema.partial();
export type UpdateSavedAddressInput = z.infer<typeof updateSavedAddressSchema>;

// --- output ---
export const savedAddressSchema = addressSchema.extend({
  id: z.uuid(),
  apartmentNumber: z.string().nullable(),
  isDefault: z.boolean(),
});
export type SavedAddress = z.infer<typeof savedAddressSchema>;

export const savedAddressListSchema = z.array(savedAddressSchema);
