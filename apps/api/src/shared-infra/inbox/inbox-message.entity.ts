import { defineEntity, type InferEntity, p } from '@mikro-orm/core';

export const InboxMessageEntity = defineEntity({
  name: 'InboxMessage',
  schema: 'inbox', // analogicznie do Twojego outboxa
  properties: {
    // Kompozytowy klucz główny (eventId + handlerName)
    eventId: p.uuid().primary(),
    handlerName: p.string().primary(),

    processedAt: p.datetime().onCreate(() => new Date()),
  },
});

export interface IInboxMessage extends InferEntity<typeof InboxMessageEntity> {}
