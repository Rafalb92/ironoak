import { randomUUID } from 'node:crypto';

export abstract class DomainEvent {
  public readonly occurredAt: Date;
  public readonly eventId: string;

  constructor() {
    this.eventId = randomUUID();
    this.occurredAt = new Date();
  }

  abstract get eventName(): string;

  abstract toPayload(): Record<string, unknown>;
}
