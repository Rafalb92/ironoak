import { z } from 'zod';

export const productQuerySchema = z.object({
  // filtry
  category: z.string().optional(), // slug kategorii
  material: z.string().optional(),
  color: z.string().optional(),
  finish: z.string().optional(),

  // zakresy (slider wagi, slider ceny)
  minWeight: z.coerce.number().int().nonnegative().optional(), // w gramach
  maxWeight: z.coerce.number().int().nonnegative().optional(),
  minPrice: z.coerce.number().int().nonnegative().optional(), // w groszach
  maxPrice: z.coerce.number().int().nonnegative().optional(),

  // wyszukiwanie tekstowe
  search: z.string().optional(),

  // sortowanie
  sort: z.enum(['name', 'price_asc', 'price_desc', 'newest']).default('newest'),

  // paginacja
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(12),
});

export type ProductQuery = z.infer<typeof productQuerySchema>;
