import { DomainEvent } from './domain-event.base';

export abstract class AggregateRoot {
  private _domainEvents: DomainEvent[] = [];

  // agregat rejestruje zdarzenie u siebie (protected — tylko on sam)
  protected addDomainEvent(event: DomainEvent): void {
    this._domainEvents.push(event);
  }

  // repozytorium wyciąga zdarzenia po zapisie i czyści (publikacja raz)
  public pullDomainEvents(): DomainEvent[] {
    const events = this._domainEvents;
    this._domainEvents = [];
    return events;
  }
}
