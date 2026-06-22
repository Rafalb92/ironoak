import { defineEntity, type InferEntity, p } from '@mikro-orm/core';

export const HealthSchema = defineEntity({
  name: 'Health',
  properties: {
    id: p.integer().primary(),
    createdAt: p.date().defaultRaw('CURRENT_TIMESTAMP'),
  },
});

export type IHealth = InferEntity<typeof HealthSchema>;
