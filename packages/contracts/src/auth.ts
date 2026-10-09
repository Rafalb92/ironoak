import { z } from 'zod';

// --- input ---
export const loginSchema = z.object({
  email: z.email('Enter a valid email address'),
  password: z.string().min(1, 'Enter your password'),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  email: z.email('Enter a valid email address'),
  password: z.string().min(8, 'Use at least 8 characters').max(128, 'Use at most 128 characters'),
});
export type RegisterInput = z.infer<typeof registerSchema>;

// --- output ---
export const authSuccessSchema = z.object({
  success: z.literal(true),
});
export type AuthSuccess = z.infer<typeof authSuccessSchema>;

export const registerResultSchema = z.object({
  userId: z.uuid(),
});
export type RegisterResult = z.infer<typeof registerResultSchema>;

export const currentUserSchema = z.object({
  userId: z.uuid(),
  role: z.enum(['USER', 'ADMIN']),
});
export type CurrentUser = z.infer<typeof currentUserSchema>;
