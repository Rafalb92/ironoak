import { z } from 'zod';

export const loginUserSchema = z.object({
  email: z.email('Nieprawidłowy adres e-mail'),
  password: z.string().min(1, 'Hasło wymagane'),
});

export type LoginUserDto = z.infer<typeof loginUserSchema>;
