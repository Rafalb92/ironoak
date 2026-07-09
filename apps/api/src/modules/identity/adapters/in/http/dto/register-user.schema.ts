import { z } from 'zod';

export const registerUserSchema = z.object({
  email: z.email('Nieprawidłowy adres e-mail'),
  password: z
    .string()
    .min(8, 'Hasło musi mieć min. 8 znaków')
    .max(128, 'Hasło zbyt długie'),
});

export type RegisterUserDto = z.infer<typeof registerUserSchema>;
