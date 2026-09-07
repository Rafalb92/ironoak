import { z } from 'zod';

// --- wejście ---
export const loginSchema = z.object({
  email: z.email('Nieprawidłowy adres e-mail'),
  password: z.string().min(1, 'Hasło wymagane'),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  email: z.email('Nieprawidłowy adres e-mail'),
  password: z
    .string()
    .min(8, 'Hasło musi mieć min. 8 znaków')
    .max(128, 'Hasło zbyt długie'),
});
export type RegisterInput = z.infer<typeof registerSchema>;

// --- wyjście ---
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
