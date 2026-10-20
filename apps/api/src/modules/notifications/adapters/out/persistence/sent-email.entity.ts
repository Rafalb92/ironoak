import { defineEntity, type InferEntity, p } from '@mikro-orm/core';

/**
 * Log of every email the system tried to send: a second guard against
 * duplicates, a view for the admin, and proof of what was sent even when
 * the SMTP provider refuses delivery.
 */
export const SentEmailSchema = defineEntity({
  name: 'SentEmail',
  schema: 'notifications',
  properties: {
    id: p.uuid().primary().defaultRaw('gen_random_uuid()'),
    eventId: p.uuid(),
    type: p.string(), // ORDER_CONFIRMED | ORDER_SHIPPED | ORDER_CANCELLED
    // nullable: rows logged before it existed, and future non-order emails
    orderId: p.uuid().nullable(),
    recipient: p.string(),
    subject: p.string(),
    status: p.enum(['PENDING', 'SENT', 'FAILED']),
    error: p.text().nullable(),
    createdAt: p.datetime().onCreate(() => new Date()),
    sentAt: p.datetime().nullable(),
  },
  uniques: [{ properties: ['eventId', 'type'] }],
  indexes: [{ properties: ['orderId'] }],
});

export interface ISentEmail extends InferEntity<typeof SentEmailSchema> {}
