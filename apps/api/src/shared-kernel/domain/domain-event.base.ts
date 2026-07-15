export abstract class DomainEvent {
  public readonly occurredAt: Date;

  constructor() {
    this.occurredAt = new Date();
  }

  // nazwa zdarzenia — do outboxa i logowania
  abstract get eventName(): string;
}
