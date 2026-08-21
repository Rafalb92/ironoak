# ADR-0007: Inbox pattern for consumer idempotency

**Status:** Accepted
**Date:** 2026-08-21

## Context

The outbox guarantees at-least-once delivery (ADR-0005). Stripe webhooks
carry the same guarantee. A consumer can therefore receive the same event
more than once.

For a logging handler this is harmless. For `ReserveStockUseCase` it means
reserving the same items twice.

## Decision

Every consumer records the events it has handled in `inbox.inbox_message`,
keyed by the composite primary key `(eventId, handlerName)`.

Before running its logic, a handler inserts its row. If the insert violates
the unique constraint, the event has already been handled and the handler
returns.

Duplicate detection relies on the database constraint rather than a
`SELECT ... IF NOT EXISTS` check, because the latter has a race: two
concurrent deliveries could both read "not present" and both proceed. An
insert is atomic — one wins, the other raises
`UniqueConstraintViolationException`.

`handlerName` is part of the key so that several consumers can each process
the same event exactly once. With `eventId` alone, the first handler would
consume the event for everyone.

## Alternatives considered

**Making every handler naturally idempotent.** Rejected as a sole strategy:
possible for some operations (releasing stock, marking a payment succeeded)
but not for all, and it pushes the concern into every handler instead of
solving it once.

**Deduplication in the broker.** Not available — the in-process bus has no
such feature.

## Consequences

**Positive:** One mechanism covers all consumers, including Stripe webhooks
(which reuse Stripe's `event.id`). Adding a consumer means adding a handler
name, nothing else.

**Negative:** Every event handled costs one extra insert. Negligible at
this scale.

**Ordering caveat:** Business logic and the inbox row share a transaction,
so database work is effectively exactly-once — a rollback removes both.
Effects **outside** the database (sending an email, calling an external
API) are not covered: they run before the constraint fires and cannot be
rolled back. Such handlers must flush the inbox row before performing the
side effect.

**Operational note:** The table grows indefinitely and needs a retention
policy — not yet implemented.
