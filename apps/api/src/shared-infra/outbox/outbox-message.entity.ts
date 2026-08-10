import { defineEntity, type InferEntity, p } from '@mikro-orm/core';

export const OutboxMessageSchema = defineEntity({
  name: 'OutboxMessage',
  schema: 'outbox',
  properties: {
    // bigserial — monotoniczny, daje naturalną kolejność publikacji
    id: p.bigint().primary().generated('identity'),

    // unikalny ID zdarzenia — do idempotencji po stronie konsumenta
    eventId: p.uuid().unique(),

    aggregateId: p.uuid(),
    aggregateType: p.string(), // 'Order', 'Payment'...
    eventName: p.string(), // 'order.placed'
    payload: p.json<Record<string, unknown>>(),

    occurredAt: p.datetime(), // kiedy zdarzenie zaszło w domenie
    createdAt: p.datetime().onCreate(() => new Date()),
    processedAt: p.datetime().nullable(), // null = czeka na publikację

    attempts: p.integer().default(0),
    lastError: p.text().nullable(),
  },
  indexes: [
    // indeks CZĘŚCIOWY — obejmuje tylko nieprzetworzone wiersze,
    // więc zostaje mały nawet przy milionach rekordów w tabeli
    {
      name: 'outbox_pending_idx',
      expression: (columns, table, indexName) =>
        `create index "${indexName}" on "${table.schema}"."${table.name}" ("${columns.id}") where "${columns.processedAt}" is null`,
    },
  ],
});

export interface IOutboxMessage extends InferEntity<
  typeof OutboxMessageSchema
> {}
